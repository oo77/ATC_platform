import { g as defineEventHandler, r as readBody, h as createError } from '../../../../_/nitro.mjs';
import { c as checkMarkingAccess, j as createMarkingRequest } from '../../../../_/attendanceMarkingRepository.mjs';
import { g as getInstructorByUserId } from '../../../../_/instructorRepository.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../../_/academicHours.mjs';
import '../../../../_/activityLogRepository.mjs';

const requests_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] POST /api/attendance/marking/requests - User: ${userId}, Role: ${role}`);
    if (!body.scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C scheduleEventId"
      });
    }
    if (!body.reason || body.reason.trim().length < 10) {
      throw createError({
        statusCode: 400,
        message: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0443 \u043E\u043F\u043E\u0437\u0434\u0430\u043D\u0438\u044F (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 10 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432)"
      });
    }
    let instructorId;
    if (role === "TEACHER") {
      const instructor = await getInstructorByUserId(userId);
      if (!instructor) {
        throw createError({
          statusCode: 403,
          message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0434\u043B\u044F \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
        });
      }
      instructorId = instructor.id;
    } else if (body.instructorId) {
      instructorId = body.instructorId;
    } else {
      const { executeQuery } = await import('../../../../_/nitro.mjs').then(function (n) { return n.aI; });
      const [event2] = await executeQuery(
        "SELECT instructor_id FROM schedule_events WHERE id = ?",
        [body.scheduleEventId]
      );
      if (event2?.instructor_id) {
        instructorId = event2.instructor_id;
        console.log(`[Attendance Marking] Got instructorId from event: ${instructorId}`);
      } else {
        throw createError({
          statusCode: 400,
          message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u0434\u043B\u044F \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u044F"
        });
      }
    }
    if (!instructorId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430"
      });
    }
    const accessCheck = await checkMarkingAccess(body.scheduleEventId, userId, role, instructorId);
    if (accessCheck.allowed && accessCheck.status !== "requires_approval") {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F. \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E"
      });
    }
    const request = await createMarkingRequest({
      scheduleEventId: body.scheduleEventId,
      instructorId,
      reason: body.reason.trim()
    });
    await logActivity(
      event,
      "CREATE",
      "ATTENDANCE",
      request.id,
      `\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u043E\u0442\u043C\u0435\u0442\u043A\u0438 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438`,
      {
        scheduleEventId: body.scheduleEventId,
        instructorId,
        reason: body.reason
      }
    );
    return {
      success: true,
      request,
      message: "\u0417\u0430\u043F\u0440\u043E\u0441 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u043D\u0430 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443"
    };
  } catch (error) {
    console.error("[Attendance Marking] Error creating request:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0430"
    });
  }
});

export { requests_post as default };
//# sourceMappingURL=requests.post.mjs.map
