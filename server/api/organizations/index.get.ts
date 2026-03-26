import { defineEventHandler, getQuery, createError } from 'h3';
import { getOrganizationsPaginated, type PaginationParams } from '../../repositories/organizationRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';
import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * GET /api/organizations
 * Получение списка организаций с пагинацией и фильтрами
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const params: PaginationParams = {
      page: query.page ? parseInt(query.page as string, 10) : 1,
      limit: query.limit ? parseInt(query.limit as string, 10) : 20,
      filters: {
        search: query.search as string | undefined,
        isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      },
    };

    const result = await getOrganizationsPaginated(params);

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'VIEW',
      entityType: 'ORGANIZATION',
      details: {
        page: params.page,
        limit: params.limit,
        filters: params.filters,
        resultCount: result.data.length,
      },
    });

    // Получаем общую статистику для карточек
    const [summaryResult] = await executeQuery<RowDataPacket[]>(`
      SELECT COUNT(*) as totalIssued
      FROM issued_certificates
      WHERE status = 'issued'
    `);
    const totalIssued = (summaryResult as any)?.[0]?.totalIssued || 0;

    return {
      success: true,
      ...result,
      stats: {
        totalIssued,
      }
    };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении списка организаций',
    });
  }
});
