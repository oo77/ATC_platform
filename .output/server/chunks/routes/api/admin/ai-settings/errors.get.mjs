import { g as defineEventHandler, i as getQuery, h as createError } from '../../../../_/nitro.mjs';
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

const errors_get = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);
  console.log("[AI Settings API] GET errors");
  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit) || 50;
    const errors = await aiSettingsRepository.getRecentErrors(limit);
    const errorsByType = await aiSettingsRepository.getErrorsByType();
    const errorCount24h = await aiSettingsRepository.getErrorCount24h();
    return {
      success: true,
      data: {
        errors,
        errorsByType,
        errorCount24h
      }
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043B\u043E\u0433\u043E\u0432 \u043E\u0448\u0438\u0431\u043E\u043A AI"
    });
  }
});

export { errors_get as default };
//# sourceMappingURL=errors.get.mjs.map
