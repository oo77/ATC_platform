import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { f as getPendingMarkingsForInstructor, d as getMarkingStatistics } from '../../../../_/attendanceMarkingRepository.mjs';
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

const pending_get = defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    const role = event.context.user?.role;
    console.log(`[Attendance Marking] GET /api/attendance/marking/pending - User: ${userId}, Role: ${role}`);
    let instructorId;
    if (role === "TEACHER") {
      const instructor = await getInstructorByUserId(userId);
      if (!instructor) {
        return {
          success: true,
          pending: [],
          statistics: {
            pending: 0,
            overdue: 0,
            late: 0,
            onTime: 0,
            pendingRequests: 0
          }
        };
      }
      instructorId = instructor.id;
    }
    const pending = instructorId ? await getPendingMarkingsForInstructor(instructorId) : [];
    const statistics = await getMarkingStatistics(instructorId);
    return {
      success: true,
      pending,
      statistics
    };
  } catch (error) {
    console.error("[Attendance Marking] Error getting pending markings:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043D\u0435\u043E\u0442\u043C\u0435\u0447\u0435\u043D\u043D\u044B\u0445 \u0437\u0430\u043D\u044F\u0442\u0438\u0439"
    });
  }
});

export { pending_get as default };
//# sourceMappingURL=pending.get.mjs.map
