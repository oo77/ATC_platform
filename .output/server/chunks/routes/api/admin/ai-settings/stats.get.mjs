import { g as defineEventHandler, h as createError } from '../../../../_/nitro.mjs';
import { aiSettingsRepository } from '../../../../_/aiSettingsRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../../_/permissions.mjs';
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

const stats_get = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);
  console.log("[AI Settings API] GET stats");
  try {
    const stats = await aiSettingsRepository.getStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 AI"
    });
  }
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
