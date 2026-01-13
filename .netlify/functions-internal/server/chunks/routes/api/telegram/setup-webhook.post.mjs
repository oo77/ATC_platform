import { d as defineEventHandler, c as createError, r as readBody, R as getBot } from '../../../nitro/nitro.mjs';
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

const setupWebhook_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D. \u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430."
    });
  }
  try {
    const body = await readBody(event);
    const { webhookUrl, dropPendingUpdates = true } = body || {};
    if (!webhookUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D URL webhook"
      });
    }
    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== "https:") {
        throw new Error("Webhook URL \u0434\u043E\u043B\u0436\u0435\u043D \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C HTTPS");
      }
    } catch (urlError) {
      throw createError({
        statusCode: 400,
        statusMessage: urlError.message || "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u044B\u0439 URL"
      });
    }
    const bot = getBot();
    if (!bot) {
      throw createError({
        statusCode: 500,
        statusMessage: "Telegram \u0431\u043E\u0442 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 TELEGRAM_BOT_TOKEN."
      });
    }
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || void 0;
    await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: dropPendingUpdates,
      secret_token: secretToken,
      allowed_updates: ["message", "callback_query"]
    });
    const webhookInfo = await bot.api.getWebhookInfo();
    await logActivity(
      event,
      "UPDATE",
      "SYSTEM",
      "telegram_bot",
      "Telegram Bot Webhook",
      {
        webhookUrl,
        dropPendingUpdates,
        hasSecretToken: !!secretToken
      }
    );
    console.log(`[Telegram Setup] Webhook \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D: ${webhookUrl}`);
    return {
      success: true,
      message: "Webhook \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D",
      webhookInfo: {
        url: webhookInfo.url,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message,
        maxConnections: webhookInfo.max_connections,
        allowedUpdates: webhookInfo.allowed_updates
      }
    };
  } catch (error) {
    console.error("[Telegram Setup] \u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 webhook:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 webhook"
    });
  }
});

export { setupWebhook_post as default };
//# sourceMappingURL=setup-webhook.post.mjs.map
