/**
 * GET /api/attendance/marking/pending
 * Получить неотмеченные занятия текущего инструктора
 */

import { getPendingMarkingsForInstructor, getMarkingStatistics } from '../../../repositories/attendanceMarkingRepository';
import { getInstructorByUserId } from '../../../repositories/instructorRepository';

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] GET /api/attendance/marking/pending - User: ${userId}, Role: ${role}`);

    // Получаем инструктора для текущего пользователя
    let instructorId: string | undefined;

    if (role === 'TEACHER') {
      const instructor = await getInstructorByUserId(userId!);
      if (!instructor) {
        return {
          success: true,
          pending: [],
          statistics: {
            pending: 0,
            overdue: 0,
            late: 0,
            onTime: 0,
            pendingRequests: 0,
          },
        };
      }
      instructorId = instructor.id;
    }

    // Получаем неотмеченные занятия
    const pending = instructorId 
      ? await getPendingMarkingsForInstructor(instructorId)
      : [];

    // Получаем статистику
    const statistics = await getMarkingStatistics(instructorId);

    return {
      success: true,
      pending,
      statistics,
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error getting pending markings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении неотмеченных занятий',
    });
  }
});
