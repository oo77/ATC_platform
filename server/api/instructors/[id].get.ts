/**
 * API endpoint для получения инструктора по ID
 * GET /api/instructors/:id
 */

import { getInstructorById } from '../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

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
