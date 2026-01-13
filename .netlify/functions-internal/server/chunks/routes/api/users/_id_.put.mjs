import { d as defineEventHandler, c as createError, e as executeQuery, r as readBody, i as toPublicUser } from '../../../nitro/nitro.mjs';
import { v as validate, u as updateProfileSchema } from '../../../_/validation.mjs';
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
import 'zod';
import '../../../_/activityLogRepository.mjs';

const _id__put = defineEventHandler(async (event) => {
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
    const [userToUpdate] = await executeQuery(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!userToUpdate) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          success: false,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        }
      });
    }
    const canUpdate = currentUser.role === "ADMIN" || // Админ может редактировать всех
    currentUser.role === "MANAGER" && userToUpdate.role !== "ADMIN" || // Модератор может редактировать всех кроме админов
    currentUser.id === userId;
    if (!canUpdate) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          success: false,
          message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
        }
      });
    }
    const body = await readBody(event);
    const validation = validate(updateProfileSchema, body);
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
    const updates = [];
    const params = [];
    if (data.name !== void 0) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.phone !== void 0) {
      updates.push("phone = ?");
      params.push(data.phone || null);
    }
    if (data.workplace !== void 0) {
      updates.push("workplace = ?");
      params.push(data.workplace || null);
    }
    if (data.position !== void 0) {
      updates.push("position = ?");
      params.push(data.position || null);
    }
    if (data.pinfl !== void 0) {
      updates.push("pinfl = ?");
      params.push(data.pinfl || null);
    }
    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          success: false,
          message: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F"
        }
      });
    }
    updates.push("updated_at = NOW(3)");
    params.push(userId);
    await executeQuery(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    const [updatedUser] = await executeQuery(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!updatedUser) {
      throw new Error("Failed to fetch updated user");
    }
    console.log(`\u2705 User updated by ${currentUser.email}: ${updatedUser.email}`);
    await logActivity(
      event,
      "UPDATE",
      "USER",
      userId,
      updatedUser.name,
      { updatedFields: Object.keys(data) }
    );
    return {
      success: true,
      user: toPublicUser(updatedUser),
      message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D"
    };
  } catch (error) {
    console.error("Update user error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
      }
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
