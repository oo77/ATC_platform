import { d as defineEventHandler, g as getQuery, c as createError } from '../../../../nitro/nitro.mjs';
import { n as getMarkingStatuses } from '../../../../_/attendanceMarkingRepository.mjs';
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

const status_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] GET /api/attendance/marking/status - User: ${userId}, Role: ${role}`);
    const filters = {};
    if (query.groupId) {
      filters.groupId = String(query.groupId);
    }
    if (query.status) {
      const statuses2 = String(query.status).split(",");
      filters.status = statuses2.length > 1 ? statuses2 : statuses2[0];
    }
    if (query.dateFrom) {
      filters.dateFrom = String(query.dateFrom);
    }
    if (query.dateTo) {
      filters.dateTo = String(query.dateTo);
    }
    if (query.onlyOverdue === "true") {
      filters.onlyOverdue = true;
    }
    if (query.onlyPending === "true") {
      filters.onlyPending = true;
    }
    if (role === "TEACHER") {
      const instructor = await getInstructorByUserId(userId);
      if (instructor) {
        filters.instructorId = instructor.id;
      } else {
        return {
          success: true,
          statuses: [],
          total: 0
        };
      }
    } else if (query.instructorId) {
      filters.instructorId = String(query.instructorId);
    }
    const statuses = await getMarkingStatuses(filters);
    return {
      success: true,
      statuses,
      total: statuses.length
    };
  } catch (error) {
    console.error("[Attendance Marking] Error getting statuses:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u043E\u0442\u043C\u0435\u0442\u043A\u0438"
    });
  }
});

export { status_get as default };
//# sourceMappingURL=status.get.mjs.map
