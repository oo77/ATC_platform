import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { a as getInstructorHoursStats } from '../../../../_/instructorRepository.mjs';
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

const hours_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const stats = await getInstructorHoursStats(id);
    if (!stats) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    await logActivity(
      event,
      "READ",
      "INSTRUCTOR",
      id,
      `\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0447\u0430\u0441\u043E\u0432`,
      {
        maxHours: stats.maxHours,
        totalUsedHours: stats.totalUsedHours,
        totalScheduledHours: stats.totalScheduledHours,
        remainingHours: stats.remainingHours
      }
    );
    return {
      success: true,
      stats
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error fetching instructor hours stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u0447\u0430\u0441\u043E\u0432"
    });
  }
});

export { hours_get as default };
//# sourceMappingURL=hours.get.mjs.map
