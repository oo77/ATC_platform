/**
 * API endpoint для получения списка курсов с пагинацией
 * GET /api/courses?page=1&limit=10&search=...
 */

import { getCoursesPaginated, type CourseFilters } from '../../repositories/courseRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Парсим фильтры
    const filters: CourseFilters = {};
    
    if (query.search) {
      filters.search = query.search as string;
    }
    
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    }
    
    if (query.certificateTemplateId) {
      filters.certificateTemplateId = query.certificateTemplateId as string;
    }

    // Парсим параметры пагинации
    const page = query.page ? parseInt(query.page as string, 10) : 1;
    const limit = query.limit ? Math.min(parseInt(query.limit as string, 10), 100) : 10;

    const result = await getCoursesPaginated({ page, limit, filters });

    return {
      success: true,
      courses: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  } catch (error) {
    console.error('Ошибка получения списка курсов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка курсов',
      courses: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
});
