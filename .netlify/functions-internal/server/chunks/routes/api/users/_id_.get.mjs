import { d as defineEventHandler, c as createError, e as executeQuery, i as toPublicUser } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user;
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          success: false,
          message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
        }
      });
    }
    const userId = event.context.params?.id;
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          success: false,
          message: "ID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
        }
      });
    }
    const [user] = await executeQuery(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          success: false,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        }
      });
    }
    const canView = currentUser.role === "ADMIN" || currentUser.role === "MANAGER" || currentUser.id === userId;
    if (!canView) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
        }
      });
    }
    return {
      success: true,
      user: toPublicUser(user)
    };
  } catch (error) {
    console.error("Get user error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
      }
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
