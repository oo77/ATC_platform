import { executeQuery } from "../../../utils/db";
import { getStudentCourses } from "../../../repositories/studentCourseRepository";

/**
 * GET /api/students/[id]/courses
 * Получение списка курсов конкретного студента (для администраторов/модераторов)
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const studentId = event.context.params?.id;

  // Логирование запроса
  console.log(
    `[API] GET /api/students/${studentId}/courses - Requested by user:`,
    user?.id
  );

  if (!user) {
    console.error("[API] Unauthorized access attempt to student courses");
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // Проверка прав доступа (только администраторы и модераторы)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    console.error(
      `[API] Access denied for user ${user.id} with role ${user.role}`
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  if (!studentId) {
    console.error("[API] Student ID is required");
    throw createError({
      statusCode: 400,
      statusMessage: "Student ID is required",
    });
  }

  try {
    // Получаем user_id студента по student_id
    const studentData = await executeQuery<any[]>(
      "SELECT user_id FROM students WHERE id = ? LIMIT 1",
      [studentId]
    );

    if (studentData.length === 0) {
      console.error(`[API] Student not found: ${studentId}`);
      throw createError({
        statusCode: 404,
        statusMessage: "Student not found",
      });
    }

    const userId = studentData[0].user_id;

    // Получаем курсы студента
    const courses = await getStudentCourses(userId);

    console.log(
      `[API] Successfully retrieved ${courses.length} courses for student ${studentId} (user ${userId})`
    );

    return courses;
  } catch (error: any) {
    console.error("[API] Failed to get student courses:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to retrieve courses",
    });
  }
});
