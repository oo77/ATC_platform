import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { m as updateAttendanceSetting, l as getAttendanceSettings } from '../../../../_/attendanceMarkingRepository.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';
import '../../../../_/activityLogRepository.mjs';

const settings_put = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] PUT /api/attendance/marking/settings - User: ${userId}, Role: ${role}`);
    if (role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0440\u043E\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430"
      });
    }
    const validKeys = [
      "ATTENDANCE_MARK_DEADLINE_HOURS",
      "ATTENDANCE_EDIT_DEADLINE_HOURS",
      "ATTENDANCE_LATE_MARK_ALLOWED",
      "ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE",
      "ATTENDANCE_REMINDER_HOURS_BEFORE",
      "ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD",
      "ATTENDANCE_AUTO_CREATE_STATUS"
    ];
    const updates = {};
    for (const key of validKeys) {
      if (body[key] !== void 0) {
        const value = String(body[key]);
        await updateAttendanceSetting(key, value, userId);
        updates[key] = value;
      }
    }
    if (Object.keys(updates).length > 0) {
      await logActivity(
        event,
        "UPDATE",
        "SYSTEM",
        "attendance_settings",
        "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u043E\u0442\u043C\u0435\u0442\u043E\u043A \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438",
        updates
      );
    }
    const settings = await getAttendanceSettings();
    return {
      success: true,
      settings,
      message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B"
    };
  } catch (error) {
    console.error("[Attendance Marking] Error updating settings:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A"
    });
  }
});

export { settings_put as default };
//# sourceMappingURL=settings.put.mjs.map
