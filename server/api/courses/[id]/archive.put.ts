import { defineEventHandler, readBody, createError } from "h3";
import {
  getCourseById,
  updateCourse,
} from "../../../repositories/courseRepository";
import { logActivity } from "../../../utils/activityLogger";
import { getPermissionContext } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID учебной программы обязателен",
    });
  }

  // 1. Проверка авторизации и прав
  const context = await getPermissionContext(event);
  if (!context) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // Разрешаем ADMIN и MANAGER (Модератор)
  if (context.role !== "ADMIN" && context.role !== "MANAGER") {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для архивации учебной программы",
    });
  }

  // 2. Чтение данных
  const body = await readBody(event);
  const { isArchived } = body;

  if (typeof isArchived !== "boolean") {
    throw createError({
      statusCode: 400,
      message: "Поле isArchived (boolean) обязательно",
    });
  }

  // 3. Проверка существования курса
  const course = await getCourseById(id, false);
  if (!course) {
    throw createError({
      statusCode: 404,
      message: "Учебная программа не найдена",
    });
  }

  // 4. Обновление
  const now = new Date();
  const updatedCourse = await updateCourse(id, {
    isArchived,
    archivedAt: isArchived ? now : null, // Если восстанавливаем, то null
    archivedBy: isArchived ? context.userId : null,
  });

  // 5. Логирование
  await logActivity(event, "UPDATE", "COURSE", id, course.name, {
    action: isArchived ? "archive" : "restore",
    previousStatus: course.isArchived,
    newStatus: isArchived,
  });

  return {
    success: true,
    message: isArchived
      ? "Учебная программа перенесена в архив"
      : "Учебная программа восстановлена из архива",
    course: updatedCourse,
  };
});
