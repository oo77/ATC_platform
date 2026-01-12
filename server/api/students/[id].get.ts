/**
 * API endpoint для получения студента по ID
 * GET /api/students/:id
 */

import { getStudentById } from '../../repositories/studentRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

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
