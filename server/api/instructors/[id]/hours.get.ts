/**
 * GET /api/instructors/:id/hours
 * Получение статистики часов инструктора
 * 
 * Возвращает:
 * - Максимальные часы по договору
 * - Отработанные часы (прошедшие занятия)
 * - Запланированные часы (будущие занятия)
 * - Оставшиеся часы
 * - Процент использования
 * - Разбивка по месяцам
 */

import { getInstructorHoursStats } from '../../../repositories/instructorRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID инструктора обязателен',
      });
    }

    const stats = await getInstructorHoursStats(id);

    if (!stats) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Инструктор не найден',
      });
    }

    // Логирование просмотра статистики часов
    await logActivity(
      event,
      'READ',
      'INSTRUCTOR',
      id,
      `Статистика часов`,
      {
        maxHours: stats.maxHours,
        totalUsedHours: stats.totalUsedHours,
        totalScheduledHours: stats.totalScheduledHours,
        remainingHours: stats.remainingHours,
      }
    );

    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error fetching instructor hours stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении статистики часов',
    });
  }
});
