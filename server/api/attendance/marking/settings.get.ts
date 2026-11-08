/**
 * GET /api/attendance/marking/settings
 * Получить настройки системы отметок
 */

import { getAttendanceSettings } from '../../../repositories/attendanceMarkingRepository';
import { Permission, requireAnyPermission } from "../../../utils/permissions";
import { attendanceActorRole } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireAnyPermission(event, [Permission.ATTENDANCE_MARK, Permission.ATTENDANCE_MANAGE]);

  try {
    const userId = event.context.user?.id;
    // Роль для логики отметки — из права attendance:manage, а не из названия роли
    const role = attendanceActorRole(event.context.user);

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
