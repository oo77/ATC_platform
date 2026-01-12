import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody, J as updateRepresentative } from '../../../nitro/nitro.mjs';
import { z } from 'zod';
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
import '../../../_/activityLogRepository.mjs';

const updateSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(20).optional(),
  accessGroups: z.array(z.string().uuid()).nullable().optional(),
  notificationsEnabled: z.boolean().optional(),
  canReceiveNotifications: z.boolean().optional(),
  permissions: z.object({
    can_view_students: z.boolean(),
    can_view_schedule: z.boolean(),
    can_view_certificates: z.boolean(),
    can_request_certificates: z.boolean()
  }).optional()
});
const _id__patch = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const body = await readBody(event);
    const validated = updateSchema.parse(body);
    const representative = await updateRepresentative(id, validated);
    if (!representative) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    await logActivity(
      event,
      "UPDATE",
      "REPRESENTATIVE",
      id,
      representative.fullName,
      {
        changes: validated
      }
    );
    return {
      success: true,
      data: representative
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F"
    });
  }
});

export { _id__patch as default };
//# sourceMappingURL=_id_.patch.mjs.map
