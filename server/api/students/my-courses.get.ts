import { getStudentCourses } from "../../repositories/studentCourseRepository";

/**
 * GET /api/students/my-courses
 * Получение списка курсов текущего студента
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;

  // Логирование запроса
  console.log("[API] GET /api/students/my-courses - User:", user?.id);

  if (!user) {
    console.error(
      "[API] Unauthorized access attempt to /api/students/my-courses"
    );
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Получаем курсы студента по user_id
    const courses = await getStudentCourses(user.id);

    console.log(
      `[API] Successfully retrieved ${courses.length} courses for user ${user.id}`
    );

    return courses;
  } catch (error: any) {
    console.error("[API] Failed to get student courses:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve courses",
    });
  }
});
