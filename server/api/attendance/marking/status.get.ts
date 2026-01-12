/**
 * GET /api/attendance/marking/status
 * Получить статусы отметки занятий с фильтрами
 */

import { getMarkingStatuses, getOverdueMarkings, getPendingMarkingsForInstructor } from '../../../repositories/attendanceMarkingRepository';
import { getInstructorByUserId } from '../../../repositories/instructorRepository';
import type { MarkingStatusFilters } from '../../../types/attendanceMarking';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] GET /api/attendance/marking/status - User: ${userId}, Role: ${role}`);

    const filters: MarkingStatusFilters = {};

    // Параметры фильтрации
    if (query.groupId) {
      filters.groupId = String(query.groupId);
    }

    if (query.status) {
      const statuses = String(query.status).split(',');
      filters.status = statuses.length > 1 ? statuses as any : statuses[0] as any;
    }

    if (query.dateFrom) {
      filters.dateFrom = String(query.dateFrom);
    }

    if (query.dateTo) {
      filters.dateTo = String(query.dateTo);
    }

    if (query.onlyOverdue === 'true') {
      filters.onlyOverdue = true;
    }

    if (query.onlyPending === 'true') {
      filters.onlyPending = true;
    }

    // Для TEACHER — только свои занятия
    if (role === 'TEACHER') {
      const instructor = await getInstructorByUserId(userId!);
      if (instructor) {
        filters.instructorId = instructor.id;
      } else {
        // Инструктор не найден — возвращаем пустой список
        return {
          success: true,
          statuses: [],
          total: 0,
        };
      }
    } else if (query.instructorId) {
      filters.instructorId = String(query.instructorId);
    }

    const statuses = await getMarkingStatuses(filters);

    return {
      success: true,
      statuses,
      total: statuses.length,
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error getting statuses:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении статусов отметки',
    });
  }
});
