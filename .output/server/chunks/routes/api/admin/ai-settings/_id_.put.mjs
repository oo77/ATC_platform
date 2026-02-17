import { g as defineEventHandler, j as getRouterParam, h as createError, r as readBody } from '../../../../_/nitro.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  const user = await requirePermission(event, Permission.SETTINGS_MANAGE);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
    });
  }
  console.log(`[AI Settings API] PUT update settings: ${id}`);
  try {
    const existing = await aiSettingsRepository.getById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const body = await readBody(event);
    if (body.provider) {
      const validProviders = ["openai", "openrouter", "anthropic", "custom"];
      if (!validProviders.includes(body.provider)) {
        throw createError({
          statusCode: 400,
          message: `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440. \u0414\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F: ${validProviders.join(", ")}`
        });
      }
    }
    const settings = await aiSettingsRepository.update(id, {
      ...body,
      updatedBy: user.userId
    });
    console.log(`[AI Settings API] \u2705 Updated settings: ${id}`);
    const { apiKeyEncrypted, ...rest } = settings;
    return {
      success: true,
      data: {
        ...rest,
        apiKeyMasked: settings.apiKeyLastFour ? `****${settings.apiKeyLastFour}` : "****"
      },
      message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 AI \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B"
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A AI"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
