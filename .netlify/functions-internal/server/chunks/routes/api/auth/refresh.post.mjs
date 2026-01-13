import { d as defineEventHandler, r as readBody, c as createError, j as verifyRefreshToken, e as executeQuery, b as createTokenPayload, f as generateToken, h as generateRefreshToken } from '../../../nitro/nitro.mjs';
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

const refresh_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: "No Refresh Token",
        data: {
          success: false,
          message: "Refresh \u0442\u043E\u043A\u0435\u043D \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D"
        }
      });
    }
    const payload = verifyRefreshToken(body.refreshToken);
    if (!payload) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Refresh Token",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043B\u0438 \u0438\u0441\u0442\u0435\u043A\u0448\u0438\u0439 refresh \u0442\u043E\u043A\u0435\u043D"
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
    const tokenPayload = createTokenPayload(user);
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    console.log(`\u2705 Token refreshed for user: ${user.email}`);
    return {
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Token Refresh Failed",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0442\u043E\u043A\u0435\u043D\u0430"
      }
    });
  }
});

export { refresh_post as default };
//# sourceMappingURL=refresh.post.mjs.map
