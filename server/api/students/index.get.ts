/**
 * API endpoint для получения списка студентов с пагинацией
 * GET /api/students?page=1&limit=10&search=...
 */

import { getStudentsPaginated, type PaginationParams } from '../../repositories/studentRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Парсим параметры пагинации и фильтрации
    const params: PaginationParams = {
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 10,
      search: query.search as string | undefined,
      fullName: query.fullName as string | undefined,
      pinfl: query.pinfl as string | undefined,
      organization: query.organization as string | undefined,
      position: query.position as string | undefined,
      hasCertificates: query.hasCertificates === 'true',
      noCertificates: query.noCertificates === 'true',
    };

    // Ограничиваем limit для предотвращения злоупотреблений
    if (params.limit && params.limit > 100) {
      params.limit = 100;
    }

    const result = await getStudentsPaginated(params);

    return {
      success: true,
      students: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  } catch (error) {
    console.error('Ошибка получения списка студентов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении списка студентов',
      students: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }
});
