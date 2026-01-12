/**
 * PUT /api/attendance/marking/settings
 * Обновить настройки системы отметок
 */

import { getAttendanceSettings, updateAttendanceSetting } from '../../../repositories/attendanceMarkingRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;

    console.log(`[Attendance Marking] PUT /api/attendance/marking/settings - User: ${userId}, Role: ${role}`);

    // Только для админов
    if (role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Доступ запрещён. Требуется роль администратора',
      });
    }

    // Валидные ключи настроек
    const validKeys = [
      'ATTENDANCE_MARK_DEADLINE_HOURS',
      'ATTENDANCE_EDIT_DEADLINE_HOURS',
      'ATTENDANCE_LATE_MARK_ALLOWED',
      'ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE',
      'ATTENDANCE_REMINDER_HOURS_BEFORE',
      'ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD',
      'ATTENDANCE_AUTO_CREATE_STATUS',
    ];

    const updates: Record<string, string> = {};

    // Обновляем каждую настройку
    for (const key of validKeys) {
      if (body[key] !== undefined) {
        const value = String(body[key]);
        await updateAttendanceSetting(key, value, userId);
        updates[key] = value;
      }
    }

    // Логируем
    if (Object.keys(updates).length > 0) {
      await logActivity(
        event,
        'UPDATE',
        'SYSTEM',
        'attendance_settings',
        'Обновлены настройки системы отметок посещаемости',
        updates
      );
    }

    // Возвращаем обновлённые настройки
    const settings = await getAttendanceSettings();

    return {
      success: true,
      settings,
      message: 'Настройки обновлены',
    };
  } catch (error: any) {
    console.error('[Attendance Marking] Error updating settings:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при обновлении настроек',
    });
  }
});
