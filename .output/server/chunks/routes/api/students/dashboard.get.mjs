import { g as defineEventHandler, h as createError } from '../../../_/nitro.mjs';
import { g as getStudentDashboardStats } from '../../../_/studentCourseRepository.mjs';
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

const dashboard_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const stats = await getStudentDashboardStats(user.id);
    if (!stats) {
      return {
        isStudent: false,
        upcomingEvents: [],
        activeCourses: [],
        upcomingDeadlines: []
      };
    }
    return {
      isStudent: true,
      ...stats
    };
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve dashboard data"
    });
  }
});

export { dashboard_get as default };
//# sourceMappingURL=dashboard.get.mjs.map
