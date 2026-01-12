/**
 * API endpoint для получения списка инструкторов с пагинацией
 * GET /api/instructors?page=1&limit=10&search=...
 */

import { getInstructorsPaginated, type InstructorFilters } from '../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Парсим фильтры
    const filters: InstructorFilters = {};
    
    if (query.search) {
      filters.search = query.search as string;
    }
    
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    }
    
    // Парсим параметры пагинации
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? Math.min(parseInt(query.limit as string, 10), 100) : 10;

    const result = await getInstructorsPaginated({ page, limit, filters });

    return {
      success: true,
      instructors: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  } catch (error) {
    console.error('Ошибка получения списка инструкторов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка инструкторов',
      instructors: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
});
