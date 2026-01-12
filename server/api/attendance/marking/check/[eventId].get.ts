/**
 * GET /api/attendance/marking/check/[eventId]
 * Проверить доступ к отметке посещаемости для конкретного занятия
 */

import { checkMarkingAccess, ensureMarkingStatus, getMarkingStatusByEventId } from '../../../../repositories/attendanceMarkingRepository';
import { getInstructorByUserId } from '../../../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId');
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] GET /api/attendance/marking/check/${eventId} - User: ${userId}, Role: ${role}`);

    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать ID занятия',
      });
    }

    // Получаем ID инструктора для текущего пользователя
    let instructorId: string | undefined;
    if (role === 'TEACHER') {
      const instructor = await getInstructorByUserId(userId!);
      instructorId = instructor?.id;
    }

    // Убеждаемся, что статус создан
    await ensureMarkingStatus(eventId);

    // Проверяем доступ
    const accessCheck = await checkMarkingAccess(eventId, userId!, role!, instructorId);

    // Получаем текущий статус отметки
    const markingStatus = await getMarkingStatusByEventId(eventId);

    return {
      success: true,
      access: accessCheck,
      markingStatus,
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error checking access:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при проверке доступа',
    });
  }
});
