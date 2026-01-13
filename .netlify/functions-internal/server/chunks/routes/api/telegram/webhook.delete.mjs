import { d as defineEventHandler, c as createError, R as getBot } from '../../../nitro/nitro.mjs';
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

const webhook_delete = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D. \u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430."
    });
  }
  try {
    const bot = getBot();
    if (!bot) {
      throw createError({
        statusCode: 500,
        statusMessage: "Telegram \u0431\u043E\u0442 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 TELEGRAM_BOT_TOKEN."
      });
    }
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    await logActivity(
      event,
      "DELETE",
      "SYSTEM",
      "telegram_bot",
      "Telegram Bot Webhook",
      {}
    );
    console.log("[Telegram Setup] Webhook \u0443\u0434\u0430\u043B\u0451\u043D");
    return {
      success: true,
      message: "Webhook \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0451\u043D"
    };
  } catch (error) {
    console.error("[Telegram Setup] \u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F webhook:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F webhook"
    });
  }
});

export { webhook_delete as default };
//# sourceMappingURL=webhook.delete.mjs.map
