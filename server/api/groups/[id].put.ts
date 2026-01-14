/**
 * API endpoint для обновления учебной группы
 * PUT /api/groups/[id]
 */

import { defineEventHandler, createError, readBody, getRouterParam } from "h3";
import { z } from "zod";
import {
  getGroupById,
  groupCodeExists,
  courseExists,
  checkStudentConflicts,
} from "../../repositories/groupRepository";
import { executeQuery } from "../../utils/db";
import { logActivity } from "../../utils/activityLogger";

const updateGroupSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  courseId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classroom: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(), // Добавлено поле архивации
});

export default defineEventHandler(async (event) => {
  // 1. Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // 2. Проверка прав (ADMIN или MODERATOR/MANAGER)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({ statusCode: 403, message: "Недостаточно прав" });
  }

  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, message: "ID группы не указан" });
    }

    const body = await readBody(event);

    // 3. Валидация данных
    const validationResult = updateGroupSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      throw createError({
        statusCode: 400,
        message: "Ошибка валидации данных",
        data: errors,
      });
    }

    const data = validationResult.data;

    // 4. Получаем текущую группу
    const existingGroup = await getGroupById(id);
    if (!existingGroup) {
      throw createError({ statusCode: 404, message: "Группа не найдена" });
    }

    // 5. Проверка прав на архивацию
    if (data.isArchived !== undefined) {
      if (user.role !== "ADMIN") {
        throw createError({
          statusCode: 403,
          message:
            "Только администратор может архивировать/восстанавливать группы",
        });
      }
    }

    // 6. Проверка прав на изменение дат (для завершенных групп)
    if (data.startDate || data.endDate) {
      const now = new Date();
      // Используем строковое сравнение или приведение типов, так как EndDate может быть строкой или Date
      const currentEndDate = new Date(existingGroup.endDate);

      // Если группа завершена и пользователь не админ
      if (now > currentEndDate && user.role !== "ADMIN") {
        throw createError({
          statusCode: 403,
          message:
            "Редактирование сроков завершенных групп доступно только администраторам. Вы можете изменять другие поля.",
        });
      }
    }

    // 7. Проверки бизнес-логики
    const newStartDate =
      data.startDate ||
      (existingGroup.startDate instanceof Date
        ? existingGroup.startDate.toISOString().split("T")[0]
        : existingGroup.startDate);
    const newEndDate =
      data.endDate ||
      (existingGroup.endDate instanceof Date
        ? existingGroup.endDate.toISOString().split("T")[0]
        : existingGroup.endDate);

    // 7.1 Проверка корректности дат
    if (new Date(newEndDate) < new Date(newStartDate)) {
      throw createError({
        statusCode: 400,
        message: "Дата окончания не может быть раньше даты начала",
      });
    }

    // 7.2 Уникальность кода
    if (data.code && data.code !== existingGroup.code) {
      if (await groupCodeExists(data.code, id)) {
        throw createError({
          statusCode: 400,
          message: "Группа с таким кодом уже существует",
        });
      }
    }

    // 7.3 Существование курса
    if (data.courseId && data.courseId !== existingGroup.courseId) {
      if (!(await courseExists(data.courseId))) {
        throw createError({
          statusCode: 400,
          message: "Выбранная учебная программа не найдена",
        });
      }
    }

    // 7.4 Конфликты участников
    if (
      (data.startDate || data.endDate) &&
      existingGroup.students &&
      existingGroup.students.length > 0
    ) {
      const studentIds = existingGroup.students.map((s) => s.studentId);
      const conflicts = await checkStudentConflicts(
        studentIds,
        newStartDate as string,
        newEndDate as string,
        id
      );

      if (conflicts.length > 0) {
        throw createError({
          statusCode: 409,
          message: "Изменение дат создаст конфликты для некоторых слушателей",
          data: conflicts,
        });
      }
    }

    // 8. Обновление в БД
    const updates: string[] = [];
    const params: any[] = [];

    if (data.code !== undefined)
      updates.push("code = ?"), params.push(data.code);
    if (data.courseId !== undefined)
      updates.push("course_id = ?"), params.push(data.courseId);
    if (data.startDate !== undefined)
      updates.push("start_date = ?"), params.push(data.startDate);
    if (data.endDate !== undefined)
      updates.push("end_date = ?"), params.push(data.endDate);
    if (data.classroom !== undefined)
      updates.push("classroom = ?"), params.push(data.classroom);
    if (data.description !== undefined)
      updates.push("description = ?"), params.push(data.description);
    if (data.isActive !== undefined)
      updates.push("is_active = ?"), params.push(data.isActive ? 1 : 0);

    // Логика архивации
    if (data.isArchived !== undefined) {
      updates.push("is_archived = ?");
      params.push(data.isArchived ? 1 : 0);

      if (data.isArchived) {
        updates.push("archived_at = NOW(3)");
        updates.push("archived_by = ?");
        params.push(user.id);
      } else {
        updates.push("archived_at = NULL");
        updates.push("archived_by = NULL");
      }
    }

    updates.push("updated_at = NOW(3)");

    if (updates.length > 0) {
      params.push(id);
      await executeQuery(
        `UPDATE study_groups SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }

    // 9. Логирование
    await logActivity(
      event,
      data.isArchived
        ? "ARCHIVE"
        : data.isArchived === false
        ? "RESTORE"
        : "UPDATE", // кастомные типы действий, если поддерживаются, или просто UPDATE
      "GROUP",
      id,
      data.code || existingGroup.code,
      {
        updatedFields: Object.keys(data),
        isArchived: data.isArchived,
      }
    );

    // 10. Возврат обновленной группы
    const updatedGroup = await getGroupById(id);

    return {
      success: true,
      message: data.isArchived
        ? "Группа архивирована"
        : data.isArchived === false
        ? "Группа восстановлена"
        : "Группа успешно обновлена",
      group: updatedGroup,
    };
  } catch (error: any) {
    console.error("Ошибка обновления группы:", error);
    // Пробрасываем h3 error или создаем новую
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка при обновлении группы",
    });
  }
});
