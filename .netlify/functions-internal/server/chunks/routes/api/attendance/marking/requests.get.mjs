import { d as defineEventHandler, a as getQuery, c as createError } from '../../../../_/nitro.mjs';
import { h as getPendingMarkingRequests, i as getMarkingRequests } from '../../../../_/attendanceMarkingRepository.mjs';
import { g as getInstructorByUserId } from '../../../../_/instructorRepository.mjs';
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

const requests_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] GET /api/attendance/marking/requests - User: ${userId}, Role: ${role}`);
    let requests;
    if (role === "ADMIN" || role === "MANAGER") {
      const filters = {};
      if (query.status) {
        filters.status = String(query.status);
      }
      if (query.instructorId) {
        filters.instructorId = String(query.instructorId);
      }
      if (query.onlyPending === "true") {
        requests = await getPendingMarkingRequests();
      } else {
        requests = await getMarkingRequests(filters);
      }
    } else if (role === "TEACHER") {
      const instructor = await getInstructorByUserId(userId);
      if (!instructor) {
        return {
          success: true,
          requests: [],
          total: 0
        };
      }
      requests = await getMarkingRequests({ instructorId: instructor.id });
    } else {
      throw createError({
        statusCode: 403,
        message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D"
      });
    }
    return {
      success: true,
      requests,
      total: requests.length
    };
  } catch (error) {
    console.error("[Attendance Marking] Error getting requests:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432"
    });
  }
});

export { requests_get as default };
//# sourceMappingURL=requests.get.mjs.map
