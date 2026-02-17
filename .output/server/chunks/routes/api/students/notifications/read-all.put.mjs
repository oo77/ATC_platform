import { g as defineEventHandler, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
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

const readAll_put = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const studentRows = await executeQuery(
      "SELECT id FROM students WHERE user_id = ? LIMIT 1",
      [user.id]
    );
    if (studentRows.length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: "Not a student"
      });
    }
    const studentId = studentRows[0].id;
    const updateQuery = `
      UPDATE student_notifications
      SET is_read = TRUE
      WHERE student_id = ? AND is_read = FALSE
    `;
    try {
      await executeQuery(updateQuery, [studentId]);
      return { success: true };
    } catch (e) {
      console.warn("student_notifications table does not exist");
      return { success: false, message: "Notifications not available" };
    }
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Failed to mark all notifications as read:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update notifications"
    });
  }
});

export { readAll_put as default };
//# sourceMappingURL=read-all.put.mjs.map
