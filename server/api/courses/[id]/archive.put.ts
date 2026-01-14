/**
 * API endpoint для архивации/разархивации учебной программы
 * PUT /api/courses/:id/archive
 */

import {
  archiveCourse,
  getCourseById,
} from "../../../repositories/courseRepository";
import { logActivity } from "../../../utils/activityLogger";
import { z } from "zod";

const archiveSchema = z.object({
  isArchived: z.boolean(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      return {
        success: false,
        message: "ID курса не указан",
      };
    }

    // Проверка авторизации
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Требуется авторизация",
      });
    }

    // Проверка прав доступа
    // Только ADMIN и MANAGER могут архивировать курсы
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw createError({
        statusCode: 403,
        message: "Недостаточно прав для архивации курса",
      });
    }

    // Валидация данных
    const body = await readBody(event);
    const validationResult = archiveSchema.safeParse(body);

    if (!validationResult.success) {
      return {
        success: false,
        message: "Неверные данные",
        errors: (validationResult.error as any).errors,
      };
    }

    const { isArchived } = validationResult.data;

    // Получаем курс для логирования
    const course = await getCourseById(id, false);
    if (!course) {
      return {
        success: false,
        message: "Курс не найден",
      };
    }

    // Архивируем/разархивируем курс
    const updated = await archiveCourse(id, isArchived, user.id);

    if (!updated) {
      return {
        success: false,
        message: "Не удалось обновить статус архивации курса",
      };
    }

    // Логируем действие
    await logActivity(event, "UPDATE", "COURSE", id, course.name, {
      action: isArchived ? "archived" : "unarchived",
      code: course.code,
    });

    return {
      success: true,
      message: isArchived
        ? "Курс успешно перемещён в архив"
        : "Курс успешно восстановлен из архива",
      course: updated,
    };
  } catch (error: any) {
    console.error("Ошибка архивации курса:", error);

    // Если это уже HTTP ошибка, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: "Ошибка при изменении статуса архивации курса",
    };
  }
});
