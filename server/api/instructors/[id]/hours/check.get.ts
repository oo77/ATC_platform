/**
 * GET /api/instructors/:id/hours/check
 * Проверка возможности добавления часов инструктору
 * 
 * Query параметры:
 * - minutes: количество минут для проверки
 * 
 * Возвращает:
 * - canTake: boolean
 * - remainingHours: number
 * - requestedHours: number
 * - message?: string
 */

import { checkInstructorHoursLimit, getInstructorById } from '../../../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID инструктора обязателен',
      });
    }

    const query = getQuery(event);
    const minutes = Number(query.minutes) || 0;

    if (minutes <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Параметр minutes должен быть положительным числом',
      });
    }

    // Проверяем существование инструктора
    const instructor = await getInstructorById(id);
    if (!instructor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Инструктор не найден',
      });
    }

    const result = await checkInstructorHoursLimit(id, minutes);

    return {
      success: true,
      instructorName: instructor.fullName,
      maxHours: instructor.maxHours,
      ...result,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error checking instructor hours limit:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при проверке лимита часов',
    });
  }
});
