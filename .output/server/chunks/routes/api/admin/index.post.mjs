import { g as defineEventHandler, r as readBody, h as createError } from '../../../_/nitro.mjs';
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

const index_post = defineEventHandler(async (event) => {
  const user = await requirePermission(event, Permission.SETTINGS_MANAGE);
  console.log("[AI Settings API] POST create new settings");
  try {
    const body = await readBody(event);
    if (!body.provider) {
      throw createError({
        statusCode: 400,
        message: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    if (!body.apiKey) {
      throw createError({
        statusCode: 400,
        message: "API \u043A\u043B\u044E\u0447 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const validProviders = ["openai", "openrouter", "anthropic", "custom"];
    if (!validProviders.includes(body.provider)) {
      throw createError({
        statusCode: 400,
        message: `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440. \u0414\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F: ${validProviders.join(", ")}`
      });
    }
    const settings = await aiSettingsRepository.create({
      ...body,
      createdBy: user.userId
    });
    console.log(`[AI Settings API] \u2705 Created settings: ${settings.id}`);
    const { apiKeyEncrypted, ...rest } = settings;
    return {
      success: true,
      data: {
        ...rest,
        apiKeyMasked: settings.apiKeyLastFour ? `****${settings.apiKeyLastFour}` : "****"
      },
      message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 AI \u0441\u043E\u0437\u0434\u0430\u043D\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E"
    };
  } catch (error) {
    console.error("[AI Settings API] Error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A AI"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
