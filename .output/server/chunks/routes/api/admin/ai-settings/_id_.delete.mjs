import { g as defineEventHandler, j as getRouterParam, h as createError } from '../../../../_/nitro.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SETTINGS_MANAGE);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
    });
  }
  console.log(`[AI Settings API] DELETE settings: ${id}`);
  try {
    const existing = await aiSettingsRepository.getById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const allSettings = await aiSettingsRepository.getAll();
    if (allSettings.length === 1) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043B\u044C\u0437\u044F \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u0443\u044E \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0443 AI. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u0443\u044E."
      });
    }
    await aiSettingsRepository.delete(id);
    console.log(`[AI Settings API] \u2705 Deleted settings: ${id}`);
    return {
      success: true,
      message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 AI \u0443\u0434\u0430\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A AI"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
