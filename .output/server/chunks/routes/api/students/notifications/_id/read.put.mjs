import { g as defineEventHandler, h as createError, j as getRouterParam } from '../../../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const read_put = defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const notificationId = getRouterParam(event, "id");
    if (!notificationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Notification ID is required"
      });
    }
    await markNotificationAsRead(notificationId, userId);
    return {
      success: true,
      message: "Notification marked as read"
    };
  } catch (error) {
    console.error("[API /students/notifications/[id]/read] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to mark notification as read"
    });
  }
});

export { read_put as default };
//# sourceMappingURL=read.put.mjs.map
