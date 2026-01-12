/**
 * PUT /api/attendance/marking/requests/[id]
 * Рассмотреть запрос на разрешение (одобрить/отклонить)
 */

import { reviewMarkingRequest, getMarkingRequestById } from '../../../../repositories/attendanceMarkingRepository';
import { logActivity } from '../../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const requestId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] PUT /api/attendance/marking/requests/${requestId} - User: ${userId}, Role: ${role}`);

    // Только для админов и менеджеров
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw createError({
        statusCode: 403,
        message: 'Доступ запрещён. Требуется роль администратора или менеджера',
      });
    }

    if (!requestId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать ID запроса',
      });
    }

    // Проверяем, что запрос существует
    const existingRequest = await getMarkingRequestById(requestId);
    if (!existingRequest) {
      throw createError({
        statusCode: 404,
        message: 'Запрос не найден',
      });
    }

    if (existingRequest.status !== 'pending') {
      throw createError({
        statusCode: 400,
        message: `Запрос уже рассмотрен (${existingRequest.status})`,
      });
    }

    // Валидация
    if (typeof body.approved !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать approved (true/false)',
      });
    }

    // Рассматриваем запрос
    const updatedRequest = await reviewMarkingRequest(requestId, userId!, {
      approved: body.approved,
      comment: body.comment || undefined,
    });

    // Логируем
    await logActivity(
      event,
      body.approved ? 'APPROVE' : 'REJECT',
      'ATTENDANCE',
      requestId,
      body.approved 
        ? `Запрос на отметку посещаемости одобрен`
        : `Запрос на отметку посещаемости отклонён`,
      {
        requestId,
        scheduleEventId: existingRequest.scheduleEventId,
        instructorId: existingRequest.instructorId,
        approved: body.approved,
        comment: body.comment,
      }
    );

    return {
      success: true,
      request: updatedRequest,
      message: body.approved 
        ? 'Запрос одобрен. Инструктор может отметить посещаемость'
        : 'Запрос отклонён',
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error reviewing request:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при рассмотрении запроса',
    });
  }
});
