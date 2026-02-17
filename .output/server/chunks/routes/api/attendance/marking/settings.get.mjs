import { g as defineEventHandler, h as createError } from '../../../../_/nitro.mjs';
import { l as getAttendanceSettings } from '../../../../_/attendanceMarkingRepository.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const settings_get = defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] GET /api/attendance/marking/settings - User: ${userId}, Role: ${role}`);
    const settings = await getAttendanceSettings();
    return {
      success: true,
      settings
    };
  } catch (error) {
    console.error("[Attendance Marking] Error getting settings:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A"
    });
  }
});

export { settings_get as default };
//# sourceMappingURL=settings.get.mjs.map
