import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../../../_/nitro.mjs';
import { e as ensureMarkingStatus, c as checkMarkingAccess, g as getMarkingStatusByEventId } from '../../../../../_/attendanceMarkingRepository.mjs';
import { g as getInstructorByUserId } from '../../../../../_/instructorRepository.mjs';
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

const _eventId__get = defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, "eventId");
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] GET /api/attendance/marking/check/${eventId} - User: ${userId}, Role: ${role}`);
    if (!eventId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C ID \u0437\u0430\u043D\u044F\u0442\u0438\u044F"
      });
    }
    let instructorId;
    if (role === "TEACHER") {
      const instructor = await getInstructorByUserId(userId);
      instructorId = instructor?.id;
    }
    await ensureMarkingStatus(eventId);
    const accessCheck = await checkMarkingAccess(eventId, userId, role, instructorId);
    const markingStatus = await getMarkingStatusByEventId(eventId);
    return {
      success: true,
      access: accessCheck,
      markingStatus
    };
  } catch (error) {
    console.error("[Attendance Marking] Error checking access:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
});

export { _eventId__get as default };
//# sourceMappingURL=_eventId_.get.mjs.map
