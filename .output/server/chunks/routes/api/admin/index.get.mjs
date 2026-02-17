import { g as defineEventHandler, h as createError } from '../../../_/nitro.mjs';
import { aiSettingsRepository } from '../../../_/aiSettingsRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../_/permissions.mjs';
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

const index_get = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);
  console.log("[AI Settings API] GET all settings");
  try {
    const settings = await aiSettingsRepository.getAll();
    const safeSettings = settings.map((s) => {
      const { apiKeyEncrypted, ...rest } = s;
      return {
        ...rest,
        apiKeyMasked: s.apiKeyLastFour ? `****${s.apiKeyLastFour}` : "****"
      };
    });
    return {
      success: true,
      data: safeSettings
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A AI"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
