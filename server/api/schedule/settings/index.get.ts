/**
 * API: GET /api/schedule/settings
 * Получить все настройки расписания
 */

import { getSchedulePeriods, getScheduleSettingsAsObject } from '../../../repositories/scheduleRepository';
import type { H3Event } from 'h3';
import { requireAuthContext } from "../../../utils/permissions";

export default defineEventHandler(async (event: H3Event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAuthContext(event);

  try {
    const [periods, settings] = await Promise.all([
      getSchedulePeriods(),
      getScheduleSettingsAsObject(),
    ]);

    console.log(`[API] GET /api/schedule/settings - Получены настройки расписания`);

    return {
      success: true,
      periods,
      settings,
    };
  } catch (error: any) {
    console.error('[API] Ошибка при получении настроек расписания:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении настроек расписания',
    });
  }
});
