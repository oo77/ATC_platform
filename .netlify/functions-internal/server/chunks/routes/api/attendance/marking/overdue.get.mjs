import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { b as getOverdueMarkings, d as getMarkingStatistics } from '../../../../_/attendanceMarkingRepository.mjs';
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

const overdue_get = defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] GET /api/attendance/marking/overdue - User: ${userId}, Role: ${role}`);
    if (role !== "ADMIN" && role !== "MANAGER") {
      throw createError({
        statusCode: 403,
        message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0440\u043E\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0438\u043B\u0438 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430"
      });
    }
    const overdue = await getOverdueMarkings();
    const statistics = await getMarkingStatistics();
    return {
      success: true,
      overdue,
      statistics
    };
  } catch (error) {
    console.error("[Attendance Marking] Error getting overdue markings:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0445 \u043E\u0442\u043C\u0435\u0442\u043E\u043A"
    });
  }
});

export { overdue_get as default };
//# sourceMappingURL=overdue.get.mjs.map
