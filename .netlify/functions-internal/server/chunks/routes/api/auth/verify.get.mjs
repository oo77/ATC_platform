import { d as defineEventHandler, l as getHeader, m as extractToken, c as createError, n as verifyToken, e as executeQuery, i as toPublicUser } from '../../../nitro/nitro.mjs';
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

const verify_get = defineEventHandler(async (event) => {
  try {
    const authHeader = getHeader(event, "authorization");
    const token = extractToken(authHeader);
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: "No Token Provided",
        data: {
          success: false,
          message: "\u0422\u043E\u043A\u0435\u043D \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D"
        }
      });
    }
    const payload = verifyToken(token);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Token",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043B\u0438 \u0438\u0441\u0442\u0435\u043A\u0448\u0438\u0439 \u0442\u043E\u043A\u0435\u043D"
        }
      });
    }
    const users = await executeQuery(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [payload.userId]
    );
    if (users.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "User Not Found",
        data: {
          success: false,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        }
      });
    }
    const user = users[0];
    return {
      success: true,
      user: toPublicUser(user)
    };
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Verification Failed",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u0442\u043E\u043A\u0435\u043D\u0430"
      }
    });
  }
});

export { verify_get as default };
//# sourceMappingURL=verify.get.mjs.map
