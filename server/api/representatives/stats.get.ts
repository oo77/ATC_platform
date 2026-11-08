import { defineEventHandler } from 'h3';
import { getRepresentativeStats } from '../../repositories/representativeRepository';
import { Permission, requirePermission } from "../../utils/permissions";

/**
 * GET /api/representatives/stats
 * Получение статистики по представителям
 */
export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.REPRESENTATIVES_VIEW);

  try {
    const stats = await getRepresentativeStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error fetching representative stats:', error);
    return {
      success: false,
      data: {
        total: 0,
        pending: 0,
        approved: 0,
        blocked: 0,
      },
    };
  }
});
