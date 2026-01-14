/**
 * API endpoint для загрузки дополнительных отчетов/документов к группе
 * POST /api/groups/[id]/reports
 */

import {
  defineEventHandler,
  readMultipartFormData,
  createError,
  getRouterParam,
} from "h3";
import { executeQuery } from "../../../../utils/db";
import { getGroupById } from "../../../../repositories/groupRepository";
import { validatePdfFile } from "../../../../utils/validatePdfFile";
import { saveGroupReportFile } from "../../../../utils/groupFileStorage";
import { logActivity } from "../../../../utils/activityLogger";
import { v4 as uuidv4 } from "uuid";

export default defineEventHandler(async (event) => {
  // 1. Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // 2. Проверка прав (ADMIN или MANAGER)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для загрузки документов",
    });
  }

  // 3. Получение ID группы
  const groupId = getRouterParam(event, "id");
  if (!groupId) {
    throw createError({ statusCode: 400, message: "ID группы не указан" });
  }

  // 4. Проверка существования группы
  const group = await getGroupById(groupId);
  if (!group) {
    throw createError({ statusCode: 404, message: "Группа не найдена" });
  }

  // 5. Чтение данных формы (multipart/form-data)
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: "Ожидаются данные multipart/form-data",
    });
  }

  // 6. Разбор данных - поддержка множественной загрузки
  const pdfFiles: Array<{ buffer: Buffer; filename: string }> = [];

  for (const part of formData) {
    if (part.name === "reportFiles" || part.name === "reportFile") {
      if (part.data && part.filename) {
        pdfFiles.push({
          buffer: part.data,
          filename: part.filename,
        });
      }
    }
  }

  // 7. Валидация наличия файлов
  if (pdfFiles.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Не загружено ни одного файла",
    });
  }

  // 8. Валидация каждого файла
  for (const file of pdfFiles) {
    const pdfValidation = await validatePdfFile(file.buffer, file.filename);
    if (!pdfValidation.valid) {
      throw createError({
        statusCode: 400,
        message: `Ошибка валидации файла "${file.filename}": ${pdfValidation.error}`,
      });
    }
  }

  // 9. Сохранение файлов
  const uploadedFiles: any[] = [];

  try {
    for (const file of pdfFiles) {
      // Сохранение файла физически
      const fileResult = await saveGroupReportFile({
        groupId: groupId,
        file: file.buffer,
        originalFilename: file.filename,
        userId: user.id,
      });

      // Запись информации о файле в таблицу files
      const fileUuid = uuidv4();
      await executeQuery(
        `INSERT INTO files (
          uuid, filename, stored_name, mime_type, size_bytes, extension, 
          storage_path, full_path, category, group_id, 
          uploaded_by, uploaded_by_user, uploaded_at_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
        [
          fileUuid,
          file.filename,
          fileResult.storedName,
          "application/pdf",
          file.buffer.length,
          "pdf",
          fileResult.filePath,
          fileResult.filePath,
          "group_report",
          groupId,
          user.id,
          user.id,
          new Date(),
        ]
      );

      uploadedFiles.push({
        uuid: fileUuid,
        name: file.filename,
        size: file.buffer.length,
        url: `/api/groups/${groupId}/reports/${fileUuid}`,
      });

      // Логирование
      await logActivity(
        event,
        "UPLOAD",
        "GROUP_REPORT",
        groupId,
        file.filename,
        {
          groupCode: group.code,
          fileSize: file.buffer.length,
        }
      );
    }

    return {
      success: true,
      message: `Успешно загружено файлов: ${uploadedFiles.length}`,
      files: uploadedFiles,
    };
  } catch (error: any) {
    console.error("Ошибка загрузки документов:", error);
    throw createError({
      statusCode: 500,
      message:
        "Ошибка при загрузке документов: " + (error.message || "Unknown error"),
    });
  }
});
