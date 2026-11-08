/**
 * GET /api/attendance/marking/overdue
 * Получить просроченные отметки (для администраторов)
 */

import { getOverdueMarkings, getMarkingStatistics } from '../../../repositories/attendanceMarkingRepository';
import { attendanceActorRole } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    // Роль для логики отметки — из права attendance:manage, а не из названия роли
    const role = attendanceActorRole(event.context.user);

    console.log(`[Attendance Marking] GET /api/attendance/marking/overdue - User: ${userId}, Role: ${role}`);

    // Только для админов и менеджеров
    if (role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Доступ запрещён. Требуется роль администратора или менеджера',
      });
    }

    // Получаем просроченные отметки (это также обновит статусы на overdue)
    const overdue = await getOverdueMarkings();

    // Получаем общую статистику
    const statistics = await getMarkingStatistics();

    return {
      success: true,
      overdue,
      statistics,
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error getting overdue markings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении просроченных отметок',
    });
  }
});
