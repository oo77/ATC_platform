import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { b as bulkUpsertAttendance, u as upsertAttendance } from '../../_/attendanceRepository.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
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
import '../../_/activityLogRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.auth?.userId;
    if (body.bulk && Array.isArray(body.attendances)) {
      const count = await bulkUpsertAttendance({
        scheduleEventId: body.scheduleEventId,
        maxHours: body.maxHours,
        markedBy: userId,
        attendances: body.attendances
      });
      await logActivity(
        event,
        "UPDATE",
        "ATTENDANCE",
        body.scheduleEventId,
        `\u041C\u0430\u0441\u0441\u043E\u0432\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438`,
        { count, scheduleEventId: body.scheduleEventId }
      );
      return {
        success: true,
        message: `\u041E\u0442\u043C\u0435\u0447\u0435\u043D\u043E ${count} \u0437\u0430\u043F\u0438\u0441\u0435\u0439`,
        count
      };
    }
    if (!body.studentId || !body.scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C studentId \u0438 scheduleEventId"
      });
    }
    if (body.hoursAttended === void 0 || body.maxHours === void 0) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C hoursAttended \u0438 maxHours"
      });
    }
    if (body.hoursAttended < 0 || body.hoursAttended > body.maxHours) {
      throw createError({
        statusCode: 400,
        message: "hoursAttended \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043E\u0442 0 \u0434\u043E maxHours"
      });
    }
    const attendance = await upsertAttendance({
      studentId: body.studentId,
      scheduleEventId: body.scheduleEventId,
      hoursAttended: body.hoursAttended,
      maxHours: body.maxHours,
      notes: body.notes,
      markedBy: userId
    });
    await logActivity(
      event,
      "UPDATE",
      "ATTENDANCE",
      attendance.id,
      `\u041F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C: ${attendance.hoursAttended}/${attendance.maxHours} \u0430-\u0447`,
      {
        studentId: body.studentId,
        scheduleEventId: body.scheduleEventId,
        hoursAttended: body.hoursAttended,
        maxHours: body.maxHours
      }
    );
    return {
      success: true,
      attendance
    };
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
