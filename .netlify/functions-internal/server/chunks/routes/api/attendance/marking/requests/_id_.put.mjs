import { d as defineEventHandler, a as getRouterParam, r as readBody, c as createError } from '../../../../../nitro/nitro.mjs';
import { k as getMarkingRequestById, r as reviewMarkingRequest } from '../../../../../_/attendanceMarkingRepository.mjs';
import { l as logActivity } from '../../../../../_/activityLogger.mjs';
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
import '../../../../../_/activityLogRepository.mjs';

const _id__put = defineEventHandler(async (event) => {
  try {
    const requestId = getRouterParam(event, "id");
    const body = await readBody(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] PUT /api/attendance/marking/requests/${requestId} - User: ${userId}, Role: ${role}`);
    if (role !== "ADMIN" && role !== "MANAGER") {
      throw createError({
        statusCode: 403,
        message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0440\u043E\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0438\u043B\u0438 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430"
      });
    }
    if (!requestId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C ID \u0437\u0430\u043F\u0440\u043E\u0441\u0430"
      });
    }
    const existingRequest = await getMarkingRequestById(requestId);
    if (!existingRequest) {
      throw createError({
        statusCode: 404,
        message: "\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    if (existingRequest.status !== "pending") {
      throw createError({
        statusCode: 400,
        message: `\u0417\u0430\u043F\u0440\u043E\u0441 \u0443\u0436\u0435 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0435\u043D (${existingRequest.status})`
      });
    }
    if (typeof body.approved !== "boolean") {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C approved (true/false)"
      });
    }
    const updatedRequest = await reviewMarkingRequest(requestId, userId, {
      approved: body.approved,
      comment: body.comment || void 0
    });
    await logActivity(
      event,
      body.approved ? "APPROVE" : "REJECT",
      "ATTENDANCE",
      requestId,
      body.approved ? `\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043E\u0442\u043C\u0435\u0442\u043A\u0443 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D` : `\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043E\u0442\u043C\u0435\u0442\u043A\u0443 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438 \u043E\u0442\u043A\u043B\u043E\u043D\u0451\u043D`,
      {
        requestId,
        scheduleEventId: existingRequest.scheduleEventId,
        instructorId: existingRequest.instructorId,
        approved: body.approved,
        comment: body.comment
      }
    );
    return {
      success: true,
      request: updatedRequest,
      message: body.approved ? "\u0417\u0430\u043F\u0440\u043E\u0441 \u043E\u0434\u043E\u0431\u0440\u0435\u043D. \u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C" : "\u0417\u0430\u043F\u0440\u043E\u0441 \u043E\u0442\u043A\u043B\u043E\u043D\u0451\u043D"
    };
  } catch (error) {
    console.error("[Attendance Marking] Error reviewing request:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u0438\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0430"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
