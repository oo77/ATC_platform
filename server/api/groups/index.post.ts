/**
 * API endpoint для создания учебной группы с файлом-отчетом
 * POST /api/groups
 */

import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { executeTransaction, executeQuery } from "../../utils/db"; // Используем существующие утилиты БД
import { validatePdfFile } from "../../utils/validatePdfFile";
import { saveGroupReportFile } from "../../utils/groupFileStorage";
import { logActivity } from "../../utils/activityLogger";
import {
  groupCodeExists,
  courseExists,
  checkStudentConflicts,
  getGroupById,
} from "../../repositories/groupRepository";
import { v4 as uuidv4 } from "uuid";
import type { PoolConnection } from "mysql2/promise";

export default defineEventHandler(async (event) => {
  // 1. Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // 2. Проверка прав (ADMIN или MODERATOR/MANAGER)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для создания группы",
    });
  }

  // 3. Чтение данных формы (multipart/form-data)
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "Ожидаются данные multipart/form-data",
    });
  }

  // 4. Разбор данных
  let groupData: any = {};
  const pdfFiles: Array<{ buffer: Buffer; filename: string }> = [];

  for (const part of formData) {
    if (part.name === "data") {
      try {
        groupData = JSON.parse(part.data.toString("utf-8"));
      } catch (e) {
        throw createError({
          statusCode: 400,
          message: "Некорректный JSON в поле data",
        });
      }
    } else if (part.name === "reportFile") {
      if (part.data && part.filename) {
        pdfFiles.push({
          buffer: part.data,
          filename: part.filename,
        });
      }
    }
  }

  // 5. Валидация файлов (обязательны при создании)
  if (pdfFiles.length === 0) {
    throw createError({
      statusCode: 400,
      message: "PDF-отчеты обязательны при создании группы",
    });
  }

  // Валидация каждого файла
  for (const file of pdfFiles) {
    const pdfValidation = await validatePdfFile(file.buffer, file.filename);
    if (!pdfValidation.valid) {
      throw createError({
        statusCode: 400,
        message: `Ошибка валидации файла "${file.filename}": ${pdfValidation.error}`,
      });
    }
  }

  // 6. Валидация данных группы (упрощенная, основные проверки - в репозитории/бизнес-логике)
  if (
    !groupData.code ||
    !groupData.courseId ||
    !groupData.startDate ||
    !groupData.endDate
  ) {
    throw createError({
      statusCode: 400,
      message:
        "Отсутствуют обязательные поля (code, courseId, startDate, endDate)",
    });
  }

  // Проверка дат
  const startDate = new Date(groupData.startDate);
  const endDate = new Date(groupData.endDate);
  if (endDate < startDate) {
    throw createError({
      statusCode: 400,
      message: "Дата окончания не может быть раньше даты начала",
    });
  }

  // Проверка уникальности кода
  if (await groupCodeExists(groupData.code)) {
    throw createError({
      statusCode: 400,
      message: "Группа с таким кодом уже существует",
    });
  }

  // Проверка существования курса
  if (!(await courseExists(groupData.courseId))) {
    throw createError({
      statusCode: 400,
      message: "Выбранная учебная программа не найдена",
    });
  }

  // Проверка конфликтов студентов (если переданы)
  if (
    groupData.studentIds &&
    Array.isArray(groupData.studentIds) &&
    groupData.studentIds.length > 0
  ) {
    const conflicts = await checkStudentConflicts(
      groupData.studentIds,
      groupData.startDate,
      groupData.endDate
    );
    if (conflicts.length > 0) {
      // Возвращаем 409 с деталями
      throw createError({
        statusCode: 409,
        message: "Обнаружены конфликты расписания для студентов",
        data: conflicts,
      });
    }
  }

  // 7. Транзакция создания группы и записи файла
  try {
    const newGroupId = uuidv4();
    let savedFileUrl = "";

    // Сначала сохраняем файл физически, чтобы получить путь (можно и внутри транзакции, но лучше подготовить)
    // Однако, если транзакция упадет, файл останется. Лучше сохранять после или иметь механизм очистки.
    // В данном случае, следуем плану: сохраняем файл и пишем в БД.

    const result = await executeTransaction(
      async (connection: PoolConnection) => {
        // 7.1 Вставка группы
        await connection.execute(
          `INSERT INTO study_groups (id, code, course_id, start_date, end_date, classroom, description, is_active, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW(3), NOW(3))`,
          [
            newGroupId,
            groupData.code,
            groupData.courseId,
            groupData.startDate,
            groupData.endDate,
            groupData.classroom || null,
            groupData.description || null,
            groupData.isActive !== false ? 1 : 0,
          ]
        );

        // 7.2 Добавление студентов
        if (groupData.studentIds && Array.isArray(groupData.studentIds)) {
          for (const studentId of groupData.studentIds) {
            await connection.execute(
              `INSERT INTO study_group_students (id, group_id, student_id)
             VALUES (?, ?, ?)`,
              [uuidv4(), newGroupId, studentId]
            );
          }
        }

        // 7.3 Сохранение всех файлов
        const uploadedFiles: string[] = [];

        for (const file of pdfFiles) {
          const fileResult = await saveGroupReportFile({
            groupId: newGroupId,
            file: file.buffer,
            originalFilename: file.filename,
            userId: user.id,
          });

          uploadedFiles.push(fileResult.fileUrl);

          // 7.4 Запись информации о файле в таблицу files
          await connection.execute(
            `INSERT INTO files (
             uuid, filename, stored_name, mime_type, size_bytes, extension, 
             storage_path, full_path, category, group_id, 
             uploaded_by, uploaded_by_user, uploaded_at_time, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
            [
              uuidv4(),
              file.filename,
              fileResult.storedName,
              "application/pdf",
              file.buffer.length,
              "pdf",
              fileResult.filePath,
              fileResult.filePath,
              "group_report",
              newGroupId,
              user.id,
              user.id,
              new Date(),
            ]
          );
        }

        return { newGroupId, uploadedFiles };
      }
    );

    // 8. Логирование
    await logActivity(event, "CREATE", "GROUP", newGroupId, groupData.code, {
      courseId: groupData.courseId,
      studentsCount: groupData.studentIds?.length || 0,
      filesCount: pdfFiles.length,
    });

    // 9. Возвращаем результат
    const createdGroup = await getGroupById(newGroupId); // Получаем полные данные

    return {
      success: true,
      message: `Группа успешно создана с ${pdfFiles.length} файлами`,
      group: createdGroup,
      uploadedFiles: result.uploadedFiles,
    };
  } catch (error: any) {
    console.error("Ошибка создания группы:", error);
    throw createError({
      statusCode: 500,
      message:
        "Ошибка при создании группы: " + (error.message || "Unknown error"),
    });
  }
});
