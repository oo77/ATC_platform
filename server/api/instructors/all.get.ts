/**
 * API endpoint для получения списка всех активных инструкторов (без пагинации)
 * GET /api/instructors/all
 */

import { getAllInstructors } from '../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== 'false'; // По умолчанию только активные

    const instructors = await getAllInstructors(activeOnly);

    return {
      success: true,
      instructors,
    };
  } catch (error) {
    console.error('Ошибка получения списка инструкторов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка инструкторов',
      instructors: [],
    };
  }
});
