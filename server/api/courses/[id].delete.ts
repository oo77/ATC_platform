/**
 * API endpoint для удаления курса
 * DELETE /api/courses/:id
 */

import {
  deleteCourse,
  getCourseById,
} from "../../repositories/courseRepository";
import { logActivity } from "../../utils/activityLogger";

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

    // Проверка прав доступа - только ADMIN может удалять курсы
    if (user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        message:
          "Недостаточно прав для удаления курса. Только администратор может удалять учебные программы.",
      });
    }

    // Получаем курс для логирования
    const course = await getCourseById(id);

    const deleted = await deleteCourse(id);

    if (!deleted) {
      return {
        success: false,
        message: "Курс не найден",
      };
    }

    // Логируем действие
    await logActivity(event, "DELETE", "COURSE", id, course?.name, {
      code: course?.code,
    });

    return {
      success: true,
      message: "Курс успешно удалён",
    };
  } catch (error: any) {
    console.error("Ошибка удаления курса:", error);

    // Если это уже HTTP ошибка, пробрасываем её
    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: "Ошибка при удалении курса",
    };
  }
});
