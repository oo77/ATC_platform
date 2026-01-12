import { d as defineEventHandler, r as readBody, c as createError, e as executeQuery } from '../../../nitro/nitro.mjs';
import { r as requireAuth } from '../../../_/permissions.mjs';
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
import 'jsonwebtoken';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"),
  newPassword: z.string().min(6, "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"),
  confirmPassword: z.string().min(1, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "\u041F\u0430\u0440\u043E\u043B\u0438 \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0442",
  path: ["confirmPassword"]
});
const password_put = defineEventHandler(async (event) => {
  const context = await requireAuth(event);
  const body = await readBody(event);
  const validationResult = changePasswordSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
      data: validationResult.error.issues
    });
  }
  const { currentPassword, newPassword } = validationResult.data;
  try {
    const users = await executeQuery(
      "SELECT password_hash FROM users WHERE id = ?",
      [context.userId]
    );
    if (!users || users.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C"
      });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await executeQuery(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [newPasswordHash, context.userId]
    );
    await executeQuery(
      `
      INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, entity_name)
      VALUES (?, 'UPDATE', 'USER', ?, '\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F')
      `,
      [context.userId, context.userId]
    );
    return {
      success: true,
      message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D"
    };
  } catch (error) {
    console.error("Error changing password:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0438 \u043F\u0430\u0440\u043E\u043B\u044F"
    });
  }
});

export { password_put as default };
//# sourceMappingURL=password.put.mjs.map
