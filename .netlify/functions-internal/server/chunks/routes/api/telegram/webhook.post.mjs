import { d as defineEventHandler, l as getHeader, S as verifyWebhookSecret, c as createError, r as readBody, T as handleUpdate } from '../../../nitro/nitro.mjs';
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

const webhook_post = defineEventHandler(async (event) => {
  const startTime = Date.now();
  try {
    const webhookSecret = getHeader(event, "x-telegram-bot-api-secret-token");
    if (webhookSecret && !verifyWebhookSecret(webhookSecret)) {
      console.warn("[Telegram Webhook] \u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0441\u0435\u043A\u0440\u0435\u0442 webhook");
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
      });
    }
    const update = await readBody(event);
    if (!update || typeof update !== "object") {
      console.warn("[Telegram Webhook] \u041F\u0443\u0441\u0442\u043E\u0435 \u0438\u043B\u0438 \u043D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E\u0435 \u0442\u0435\u043B\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430");
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request"
      });
    }
    console.log(`[Telegram Webhook] \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 #${update.update_id}`);
    handleUpdate(update).catch((error) => {
      console.error("[Telegram Webhook] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438:", error);
    });
    const duration = Date.now() - startTime;
    console.log(`[Telegram Webhook] \u041E\u0442\u0432\u0435\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0437\u0430 ${duration}ms`);
    return { ok: true };
  } catch (error) {
    console.error("[Telegram Webhook] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error"
    });
  }
});

export { webhook_post as default };
//# sourceMappingURL=webhook.post.mjs.map
