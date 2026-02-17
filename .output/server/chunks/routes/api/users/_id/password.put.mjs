import { g as defineEventHandler, h as createError, f as executeQuery, r as readBody } from '../../../../_/nitro.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
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
import 'crypto';
import 'node:url';
import 'jsonwebtoken';
import '../../../../_/activityLogRepository.mjs';

const resetPasswordSchema = z.object({
  password: z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432")
});
const password_put = defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user;
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const targetUserId = event.context.params?.id;
    if (!targetUserId) {
      throw createError({
        statusCode: 400,
        message: "ID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const canReset = currentUser.role === "ADMIN" || currentUser.role === "MANAGER";
    if (!canReset) {
      throw createError({
        statusCode: 403,
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u043E\u043B\u044F"
      });
    }
    const [targetUser] = await executeQuery(
      "SELECT id, role, email, name FROM users WHERE id = ? LIMIT 1",
      [targetUserId]
    );
    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    if (currentUser.role === "MANAGER" && targetUser.role === "ADMIN") {
      throw createError({
        statusCode: 403,
        message: "\u041C\u043E\u0434\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043C\u0435\u043D\u044F\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443"
      });
    }
    const body = await readBody(event);
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        data: validation.error.issues
      });
    }
    const { password } = validation.data;
    const passwordHash = await bcrypt.hash(password, 10);
    await executeQuery(
      "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
      [passwordHash, targetUserId]
    );
    console.log(`\u2705 User password reset by ${currentUser.email} for ${targetUser.email}`);
    await logActivity(
      event,
      "RESET_PASSWORD",
      "USER",
      targetUserId,
      targetUser.name,
      {
        initiator: currentUser.email
      }
    );
    return {
      success: true,
      message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D"
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u043F\u0430\u0440\u043E\u043B\u044F"
    });
  }
});

export { password_put as default };
//# sourceMappingURL=password.put.mjs.map
