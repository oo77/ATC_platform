/**
 * DELETE /api/schedule/[id]
 * Удаление события расписания
 */

import { deleteScheduleEvent, getScheduleEventById } from '../../repositories/scheduleRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID события обязателен',
      });
    }

    // Получаем событие перед удалением для логирования
    const scheduleEvent = await getScheduleEventById(id);
    if (!scheduleEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    const deleted = await deleteScheduleEvent(id);

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    // Логирование действия
    await logActivity(
      event,
      'DELETE',
      'SCHEDULE',
      id,
      scheduleEvent.title,
      {
        deletedEvent: {
          title: scheduleEvent.title,
          startTime: scheduleEvent.startTime,
          endTime: scheduleEvent.endTime,
          groupId: scheduleEvent.groupId,
          instructorId: scheduleEvent.instructorId,
        },
      }
    );

    return {
      success: true,
      message: 'Событие успешно удалено',
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error deleting schedule event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при удалении события',
    });
  }
});
