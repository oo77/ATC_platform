import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const logout_post = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (user) {
      await logActivity(
        event,
        "LOGOUT",
        "SYSTEM",
        user.id,
        user.name
      );
    }
    console.log("\u2705 User logged out");
    return {
      success: true,
      message: "\u0412\u044B\u0445\u043E\u0434 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E"
    };
  } catch (error) {
    console.error("Logout error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Logout Failed",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u044B\u0445\u043E\u0434\u0435 \u0438\u0437 \u0441\u0438\u0441\u0442\u0435\u043C\u044B"
      }
    });
  }
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
