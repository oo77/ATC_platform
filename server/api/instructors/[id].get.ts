/**
 * API endpoint для получения инструктора по ID
 * GET /api/instructors/:id
 */

import { getInstructorById } from '../../repositories/instructorRepository';
import { UserRole } from '../../types/auth';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    const authUser = event.context.user;

    if (!id) {
      return {
        success: false,
        message: 'ID инструктора не указан',
      };
    }

    const instructor = await getInstructorById(id);

    if (!instructor) {
      return {
        success: false,
        message: 'Инструктор не найден',
      };
    }

    // Проверка прав доступа для роли TEACHER
    if (authUser && authUser.role === UserRole.TEACHER) {
      // Преподаватель может запрашивать только свои данные
      if (instructor.userId !== authUser.id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          message: 'У вас нет прав для просмотра данных этого инструктора',
        });
      }
    }

    return {
      success: true,
      instructor,
    };
  } catch (error) {
    console.error('Ошибка получения инструктора:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении инструктора',
    };
  }
});
