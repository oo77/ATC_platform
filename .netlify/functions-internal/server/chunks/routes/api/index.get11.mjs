import { d as defineEventHandler, e as executeQuery, c as createError } from '../../nitro/nitro.mjs';
import { r as requireAuth } from '../../_/permissions.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const context = await requireAuth(event);
  try {
    const users = await executeQuery(
      `
      SELECT 
        id,
        role,
        name,
        email,
        phone,
        workplace,
        position,
        pinfl,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      `,
      [context.userId]
    );
    if (!users || users.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const user = users[0];
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0440\u043E\u0444\u0438\u043B\u044F"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get11.mjs.map
