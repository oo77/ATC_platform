import { defineEventHandler, getQuery, createError } from 'h3';
import { getRepresentativesPaginated, type RepresentativePaginationParams, type RepresentativeStatus } from '../../repositories/representativeRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * GET /api/representatives
 * Получение списка представителей с пагинацией и фильтрами
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const params: RepresentativePaginationParams = {
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 20,
      status: query.status as RepresentativeStatus | undefined,
      organizationId: query.organizationId as string | undefined,
      search: query.search as string | undefined,
    };

    const result = await getRepresentativesPaginated(params);

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'VIEW',
      entityType: 'REPRESENTATIVE',
      details: {
        page: params.page,
        limit: params.limit,
        filters: { status: params.status, organizationId: params.organizationId },
        resultCount: result.data.length,
      },
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Error fetching representatives:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении списка представителей',
    });
  }
});
