import { getStudentCourses } from '../../../repositories/studentCourseRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Проверка роли? 
  // В принципе любой пользователь может иметь привязанного студента (например, админ тоже может учиться?)
  // Но обычно это роль STUDENT. Пока оставим проверку наличия юзера, так как репозиторий вернет пустой массив, если нет привязки к students.

  try {
    const courses = await getStudentCourses(user.id);
    return courses;
  } catch (error: any) {
    console.error('Failed to get student courses:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve courses',
    });
  }
});
