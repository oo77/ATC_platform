import { g as defineEventHandler, h as createError, r as readBody } from '../../../_/nitro.mjs';
import { u as updateUserSettings } from '../../../_/userSettingsRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]).optional(),
  language: z.enum(["ru", "en", "uz"]).optional(),
  notifications_email: z.boolean().optional(),
  notifications_push: z.boolean().optional(),
  notifications_sms: z.boolean().optional(),
  compact_mode: z.boolean().optional(),
  font_size: z.enum(["small", "medium", "large"]).optional(),
  sidebar_color: z.string().optional()
});
const settings_put = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  const body = await readBody(event);
  const result = updateSettingsSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.errors
    });
  }
  try {
    const updatedSettings = await updateUserSettings(
      user.id,
      result.data
    );
    await logActivity(
      event,
      "UPDATE",
      "USER",
      user.id,
      user.name || user.email,
      { updatedSettings: result.data }
    );
    return updatedSettings;
  } catch (error) {
    console.error("Failed to update user settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update settings"
    });
  }
});

export { settings_put as default };
//# sourceMappingURL=settings.put.mjs.map
