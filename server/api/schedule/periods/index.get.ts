/**
 * API: GET /api/schedule/periods
 * Получить все академические пары
 */

import { getSchedulePeriods } from '../../../repositories/scheduleRepository';
import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== 'false';

    const periods = await getSchedulePeriods(activeOnly);

    console.log(`[API] GET /api/schedule/periods - Получено ${periods.length} академических пар`);

    return {
      success: true,
      periods,
    };
  } catch (error: any) {
    console.error('[API] Ошибка при получении академических пар:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении академических пар',
    });
  }
});
