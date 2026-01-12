/**
 * GET /api/attendance/marking/requests
 * Получить запросы на разрешение просроченной отметки
 */

import { getMarkingRequests, getPendingMarkingRequests } from '../../../repositories/attendanceMarkingRepository';
import { getInstructorByUserId } from '../../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] GET /api/attendance/marking/requests - User: ${userId}, Role: ${role}`);

    let requests;

    // Для админов и менеджеров — все запросы или фильтрованные
    if (role === 'ADMIN' || role === 'MANAGER') {
      const filters: { status?: any; instructorId?: string } = {};

      if (query.status) {
        filters.status = String(query.status);
      }

      if (query.instructorId) {
        filters.instructorId = String(query.instructorId);
      }

      // Если запрашиваются только ожидающие
      if (query.onlyPending === 'true') {
        requests = await getPendingMarkingRequests();
      } else {
        requests = await getMarkingRequests(filters);
      }
    } else if (role === 'TEACHER') {
      // Для инструктора — только свои запросы
      const instructor = await getInstructorByUserId(userId!);
      if (!instructor) {
        return {
          success: true,
          requests: [],
          total: 0,
        };
      }

      requests = await getMarkingRequests({ instructorId: instructor.id });
    } else {
      throw createError({
        statusCode: 403,
        message: 'Доступ запрещён',
      });
    }

    return {
      success: true,
      requests,
      total: requests.length,
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error getting requests:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении запросов',
    });
  }
});
