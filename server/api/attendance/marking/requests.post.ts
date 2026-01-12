/**
 * POST /api/attendance/marking/requests
 * Создать запрос на разрешение просроченной отметки
 */

import { createMarkingRequest, checkMarkingAccess } from '../../../repositories/attendanceMarkingRepository';
import { getInstructorByUserId } from '../../../repositories/instructorRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] POST /api/attendance/marking/requests - User: ${userId}, Role: ${role}`);

    // Валидация
    if (!body.scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать scheduleEventId',
      });
    }

    if (!body.reason || body.reason.trim().length < 10) {
      throw createError({
        statusCode: 400,
        message: 'Укажите причину опоздания (минимум 10 символов)',
      });
    }

    // Получаем ID инструктора
    let instructorId: string | undefined;

    if (role === 'TEACHER') {
      // Для роли TEACHER — получаем инструктора по user_id
      const instructor = await getInstructorByUserId(userId!);
      if (!instructor) {
        throw createError({
          statusCode: 403,
          message: 'Инструктор не найден для текущего пользователя',
        });
      }
      instructorId = instructor.id;
    } else if (body.instructorId) {
      // Если явно передан instructorId — используем его
      instructorId = body.instructorId;
    } else {
      // Пробуем получить instructorId из события расписания
      const { executeQuery } = await import('../../../utils/db');
      const [event] = await executeQuery<{ instructor_id: string | null }[]>(
        'SELECT instructor_id FROM schedule_events WHERE id = ?',
        [body.scheduleEventId]
      );
      
      if (event?.instructor_id) {
        instructorId = event.instructor_id;
        console.log(`[Attendance Marking] Got instructorId from event: ${instructorId}`);
      } else {
        throw createError({
          statusCode: 400,
          message: 'Не удалось определить инструктора для данного занятия',
        });
      }
    }

    // instructorId гарантированно определён здесь (иначе выше выбросилась бы ошибка)
    if (!instructorId) {
      throw createError({
        statusCode: 400,
        message: 'Не удалось определить инструктора',
      });
    }

    // Проверяем, что действительно нужно одобрение
    const accessCheck = await checkMarkingAccess(body.scheduleEventId, userId!, role!, instructorId);
    
    if (accessCheck.allowed && accessCheck.status !== 'requires_approval') {
      throw createError({
        statusCode: 400,
        message: 'Одобрение не требуется. Вы можете отметить посещаемость напрямую',
      });
    }

    // Создаём запрос
    const request = await createMarkingRequest({
      scheduleEventId: body.scheduleEventId,
      instructorId,
      reason: body.reason.trim(),
    });

    // Логируем
    await logActivity(
      event,
      'CREATE',
      'ATTENDANCE',
      request.id,
      `Запрос на разрешение отметки посещаемости`,
      {
        scheduleEventId: body.scheduleEventId,
        instructorId,
        reason: body.reason,
      }
    );

    return {
      success: true,
      request,
      message: 'Запрос отправлен на рассмотрение администратору',
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error creating request:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при создании запроса',
    });
  }
});
