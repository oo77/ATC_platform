/**
 * API endpoint для получения студента по ID
 * GET /api/students/:id
 */

import { getStudentById } from '../../repositories/studentRepository';
import { UserRole } from '../../types/auth';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    const authUser = event.context.user;

    if (!id) {
      return {
        success: false,
        message: 'ID студента не указан',
      };
    }

    const student = await getStudentById(id);

    if (!student) {
      return {
        success: false,
        message: 'Студент не найден',
      };
    }

    // Проверка прав доступа для роли STUDENT
    if (authUser && authUser.role === UserRole.STUDENT) {
      // Студент может запрашивать только свои данные
      if (student.userId !== authUser.id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          message: 'У вас нет прав для просмотра данных этого студента',
        });
      }
    }

    return {
      success: true,
      student,
    };
  } catch (error) {
    console.error('Ошибка получения студента:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении данных студента',
    };
  }
});
