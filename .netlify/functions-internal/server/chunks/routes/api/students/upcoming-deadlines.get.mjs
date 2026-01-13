import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import { h as getStudentByUserId } from '../../../_/studentRepository.mjs';
import { a as getUpcomingDeadlines } from '../../../_/studentNotificationService.mjs';
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

const upcomingDeadlines_get = defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const student = await getStudentByUserId(userId);
    if (!student) {
      throw createError({
        statusCode: 404,
        statusMessage: "Student not found"
      });
    }
    const allDeadlines = await getUpcomingDeadlines();
    const studentDeadlines = allDeadlines.filter((d) => d.student_id === student.id);
    return {
      success: true,
      deadlines: studentDeadlines
    };
  } catch (error) {
    console.error("[API /students/upcoming-deadlines] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch deadlines"
    });
  }
});

export { upcomingDeadlines_get as default };
//# sourceMappingURL=upcoming-deadlines.get.mjs.map
