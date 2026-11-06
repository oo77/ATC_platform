/**
 * POST /api/courses/:id/duplicate
 * Создаёт копию учебной программы вместе с дисциплинами и инструкторами
 */

import { duplicateCourse } from "../../../repositories/courseRepository";
import { logActivity } from "../../../utils/activityLogger";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.COURSES_CREATE);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID учебной программы обязателен",
    });
  }

  const course = await duplicateCourse(id);
  if (!course) {
    throw createError({
      statusCode: 404,
      message: "Учебная программа не найдена",
    });
  }

  await logActivity(event, "CREATE", "COURSE", course.id, course.name, {
    duplicatedFromId: id,
  });

  return {
    success: true,
    message: "Копия учебной программы создана",
    course,
  };
});
