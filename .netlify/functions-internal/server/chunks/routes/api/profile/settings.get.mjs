import { d as defineEventHandler, c as createError } from '../../../_/nitro.mjs';
import { g as getUserSettings } from '../../../_/userSettingsRepository.mjs';
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

const settings_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const settings = await getUserSettings(user.id);
    return settings;
  } catch (error) {
    console.error("Failed to get user settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve settings"
    });
  }
});

export { settings_get as default };
//# sourceMappingURL=settings.get.mjs.map
