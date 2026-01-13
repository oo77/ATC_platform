import { d as defineEventHandler, c as createError, g as getQuery, e as executeQuery, i as toPublicUser } from '../../nitro/nitro.mjs';
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
    if (!["ADMIN", "MANAGER", "TEACHER"].includes(currentUser.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"
        }
      });
    }
    const query = getQuery(event);
    const roleFilter = query.role;
    let sql = "SELECT * FROM users";
    const params = [];
    if (roleFilter) {
      sql += " WHERE role = ?";
      params.push(roleFilter);
    }
    if (currentUser.role === "TEACHER") {
      if (roleFilter && roleFilter !== "STUDENT") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            success: false,
            message: "\u0423\u0447\u0438\u0442\u0435\u043B\u044F \u043C\u043E\u0433\u0443\u0442 \u043F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432"
          }
        });
      }
      sql = roleFilter ? sql : "SELECT * FROM users WHERE role = ?";
      if (!roleFilter) {
        params.push("STUDENT");
      }
    }
    if (currentUser.role === "MANAGER") {
      if (roleFilter === "ADMIN") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            success: false,
            message: "\u041C\u043E\u0434\u0435\u0440\u0430\u0442\u043E\u0440\u044B \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u043F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0442\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u0432"
          }
        });
      }
      if (!roleFilter) {
        sql += " WHERE role != ?";
        params.push("ADMIN");
      }
    }
    sql += " ORDER BY created_at DESC";
    const users = await executeQuery(sql, params);
    const publicUsers = users.map(toPublicUser);
    console.log(`\u2705 Users fetched: ${publicUsers.length} users (role: ${roleFilter || "all"})`);
    return {
      success: true,
      users: publicUsers
    };
  } catch (error) {
    console.error("Get users error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"
      }
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get15.mjs.map
