import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../../../_/nitro.mjs';
import { h as getStudentByUserId } from '../../../../../_/studentRepository.mjs';
import { m as markNotificationAsRead } from '../../../../../_/studentNotificationService.mjs';
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

const read_post = defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  const id = getRouterParam(event, "id");
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing ID" });
  }
  try {
    const student = await getStudentByUserId(userId);
    if (!student) {
      throw createError({ statusCode: 404, statusMessage: "Student not found" });
    }
    await markNotificationAsRead(id, student.id);
    return { success: true };
  } catch (error) {
    console.error("[API MarkRead] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to mark as read"
    });
  }
});

export { read_post as default };
//# sourceMappingURL=read.post.mjs.map
