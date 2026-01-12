/**
 * API: PUT /api/schedule/periods
 * Массовое обновление академических пар
 */

import { updateAllSchedulePeriods } from '../../../repositories/scheduleRepository';
import type { H3Event } from 'h3';

interface UpdatePeriodData {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isAfterBreak?: boolean;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<{ periods: UpdatePeriodData[] }>(event);
    const role = event.context.auth?.role || event.context.user?.role;

    // Только администратор может менять настройки
    if (role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Доступ запрещен. Только администратор может изменять пары.',
      });
    }

    // Валидация
    if (!body.periods || !Array.isArray(body.periods) || body.periods.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Необходимо указать массив периодов',
      });
    }

    // Валидация каждого периода
    for (const period of body.periods) {
      if (!period.periodNumber || typeof period.periodNumber !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Некорректный номер пары',
        });
      }
      if (!period.startTime || !/^\d{2}:\d{2}$/.test(period.startTime)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Некорректное время начала для пары ${period.periodNumber}`,
        });
      }
      if (!period.endTime || !/^\d{2}:\d{2}$/.test(period.endTime)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Некорректное время окончания для пары ${period.periodNumber}`,
        });
      }
    }

    const periods = await updateAllSchedulePeriods(body.periods);

    console.log(`[API] PUT /api/schedule/periods - Обновлено ${periods.length} академических пар`);

    return {
      success: true,
      periods,
      message: 'Академические пары успешно обновлены',
    };
  } catch (error: any) {
    console.error('[API] Ошибка при обновлении академических пар:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при обновлении академических пар',
    });
  }
});
