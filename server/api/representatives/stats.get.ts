import { defineEventHandler } from 'h3';
import { getRepresentativeStats } from '../../repositories/representativeRepository';

/**
 * GET /api/representatives/stats
 * Получение статистики по представителям
 */
export default defineEventHandler(async (event) => {
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
