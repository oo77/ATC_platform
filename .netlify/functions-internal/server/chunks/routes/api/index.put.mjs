import { d as defineEventHandler, r as readBody, c as createError, e as executeQuery } from '../../nitro/nitro.mjs';
import { r as requireAuth } from '../../_/permissions.mjs';
import { z } from 'zod';
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

const updateProfileSchema = z.object({
  name: z.string().min(2, "\u0418\u043C\u044F \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 2 \u0441\u0438\u043C\u0432\u043E\u043B\u0430").optional(),
  phone: z.string().optional().nullable(),
  workplace: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  pinfl: z.string().length(14, "\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 14 \u0446\u0438\u0444\u0440").optional().nullable().or(z.literal(""))
});
const index_put = defineEventHandler(async (event) => {
  const context = await requireAuth(event);
  const body = await readBody(event);
  const validationResult = updateProfileSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
      data: validationResult.error.issues
    });
  }
  const data = validationResult.data;
  try {
    const updateFields = [];
    const updateValues = [];
    if (data.name !== void 0) {
      updateFields.push("name = ?");
      updateValues.push(data.name);
    }
    if (data.phone !== void 0) {
      updateFields.push("phone = ?");
      updateValues.push(data.phone || null);
    }
    if (data.workplace !== void 0) {
      updateFields.push("workplace = ?");
      updateValues.push(data.workplace || null);
    }
    if (data.position !== void 0) {
      updateFields.push("position = ?");
      updateValues.push(data.position || null);
    }
    if (data.pinfl !== void 0) {
      updateFields.push("pinfl = ?");
      updateValues.push(data.pinfl || null);
    }
    if (updateFields.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F"
      });
    }
    updateFields.push("updated_at = NOW()");
    updateValues.push(context.userId);
    await executeQuery(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );
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
    const user = users[0];
    await executeQuery(
      `
      INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, entity_name)
      VALUES (?, 'UPDATE', 'USER', ?, '\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044F')
      `,
      [context.userId, context.userId]
    );
    return {
      success: true,
      message: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D",
      user
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u044F"
    });
  }
});

export { index_put as default };
//# sourceMappingURL=index.put.mjs.map
