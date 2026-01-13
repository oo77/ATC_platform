import { d as defineEventHandler, c as createError, r as readBody, e as executeQuery, k as hashPassword, i as toPublicUser } from '../../nitro/nitro.mjs';
import { randomUUID } from 'crypto';
import { v as validate, r as registerSchema } from '../../_/validation.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
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
import 'jsonwebtoken';
import 'zod';
import '../../_/activityLogRepository.mjs';

const index_post = defineEventHandler(async (event) => {
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
    if (!["ADMIN", "MANAGER"].includes(currentUser.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"
        }
      });
    }
    const body = await readBody(event);
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: {
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
          errors: validation.errors
        }
      });
    }
    const data = validation.data;
    if (currentUser.role === "MANAGER") {
      if (data.role === "ADMIN") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            success: false,
            message: "\u041C\u043E\u0434\u0435\u0440\u0430\u0442\u043E\u0440\u044B \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0442\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u0432"
          }
        });
      }
    }
    const existingUsers = await executeQuery(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [data.email]
    );
    if (existingUsers.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "User Already Exists",
        data: {
          success: false,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
          errors: { email: ["Email \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D"] }
        }
      });
    }
    const passwordHash = await hashPassword(data.password);
    const userId = randomUUID();
    const role = data.role || "STUDENT";
    await executeQuery(
      `INSERT INTO users (id, role, name, email, password_hash, phone, workplace, position, pinfl, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        userId,
        role,
        data.name,
        data.email,
        passwordHash,
        data.phone || null,
        data.workplace || null,
        data.position || null,
        data.pinfl || null
      ]
    );
    const [newUser] = await executeQuery(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    console.log(`\u2705 User created by ${currentUser.email}: ${newUser.email} (${newUser.role})`);
    await logActivity(
      event,
      "CREATE",
      "USER",
      newUser.id,
      newUser.name,
      { email: newUser.email, role: newUser.role }
    );
    return {
      success: true,
      user: toPublicUser(newUser),
      message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D"
    };
  } catch (error) {
    console.error("Create user error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
      }
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post12.mjs.map
