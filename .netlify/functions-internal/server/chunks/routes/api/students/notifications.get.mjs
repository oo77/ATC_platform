import { d as defineEventHandler, c as createError, a as getQuery } from '../../../_/nitro.mjs';
import { h as getStudentByUserId } from '../../../_/studentRepository.mjs';
import { g as getStudentNotifications } from '../../../_/studentNotificationService.mjs';
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

const notifications_get = defineEventHandler(async (event) => {
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
    const query = getQuery(event);
    const unreadOnly = query.unread === "true";
    const notifications = await getStudentNotifications(student.id, unreadOnly);
    return {
      success: true,
      notifications
    };
  } catch (error) {
    console.error("[API /students/notifications] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to fetch notifications"
    });
  }
});

export { notifications_get as default };
//# sourceMappingURL=notifications.get.mjs.map
