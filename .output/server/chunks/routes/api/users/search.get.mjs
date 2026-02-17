import { g as defineEventHandler, h as createError, i as getQuery, f as executeQuery, q as toPublicUser } from '../../../_/nitro.mjs';
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

const search_get = defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user;
    if (!currentUser) {
      console.error("\u274C [User Search] Unauthorized access attempt");
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          success: false,
          message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
        }
      });
    }
    if (!["ADMIN", "MANAGER"].includes(currentUser.role)) {
      console.error(
        `\u274C [User Search] Access denied for role: ${currentUser.role}`
      );
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"
        }
      });
    }
    const query = getQuery(event);
    const searchQuery = (query.q || "").trim();
    const limit = parseInt(query.limit || "4", 10);
    if (!searchQuery) {
      return {
        success: true,
        users: []
      };
    }
    console.log(
      `\u{1F50D} [User Search] Query: "${searchQuery}", Limit: ${limit}, Role: ${currentUser.role}`
    );
    let sql = `
      SELECT * FROM users 
      WHERE (
        name LIKE ? OR 
        pinfl LIKE ?
      )
    `;
    const params = [`%${searchQuery}%`, `%${searchQuery}%`];
    if (currentUser.role === "MANAGER") {
      sql += " AND role != ?";
      params.push("ADMIN");
    }
    sql += " ORDER BY name ASC LIMIT ?";
    params.push(limit);
    const users = await executeQuery(sql, params);
    const publicUsers = users.map(toPublicUser);
    console.log(
      `\u2705 [User Search] Found ${publicUsers.length} users for query "${searchQuery}"`
    );
    if (publicUsers.length > 0) {
      console.log("[User Search] Sample result:", {
        id: publicUsers[0].id,
        name: publicUsers[0].name,
        role: publicUsers[0].role,
        studentId: publicUsers[0].studentId,
        instructorId: publicUsers[0].instructorId
      });
    }
    return {
      success: true,
      users: publicUsers
    };
  } catch (error) {
    console.error("\u274C [User Search] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u0438\u0441\u043A\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"
      }
    });
  }
});

export { search_get as default };
//# sourceMappingURL=search.get.mjs.map
