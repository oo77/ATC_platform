/**
 * GET /api/attendance/marking/settings
 * Получить настройки системы отметок
 */

import { getAttendanceSettings } from '../../../repositories/attendanceMarkingRepository';

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] GET /api/attendance/marking/settings - User: ${userId}, Role: ${role}`);

    const settings = await getAttendanceSettings();

    return {
      success: true,
      settings,
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error getting settings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении настроек',
    });
  }
});
