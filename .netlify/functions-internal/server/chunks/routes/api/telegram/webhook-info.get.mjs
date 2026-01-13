import { d as defineEventHandler, c as createError, R as getBot } from '../../../nitro/nitro.mjs';
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

const webhookInfo_get = defineEventHandler(async (event) => {
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
    const botInfo = await bot.api.getMe();
    const webhookInfo = await bot.api.getWebhookInfo();
    return {
      success: true,
      bot: {
        id: botInfo.id,
        firstName: botInfo.first_name,
        username: botInfo.username,
        canJoinGroups: botInfo.can_join_groups,
        canReadAllGroupMessages: botInfo.can_read_all_group_messages,
        supportsInlineQueries: botInfo.supports_inline_queries
      },
      webhook: {
        url: webhookInfo.url || null,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        ipAddress: webhookInfo.ip_address,
        lastErrorDate: webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1e3).toISOString() : null,
        lastErrorMessage: webhookInfo.last_error_message || null,
        lastSynchronizationErrorDate: webhookInfo.last_synchronization_error_date ? new Date(webhookInfo.last_synchronization_error_date * 1e3).toISOString() : null,
        maxConnections: webhookInfo.max_connections,
        allowedUpdates: webhookInfo.allowed_updates
      }
    };
  } catch (error) {
    console.error("[Telegram Info] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043E \u0431\u043E\u0442\u0435"
    });
  }
});

export { webhookInfo_get as default };
//# sourceMappingURL=webhook-info.get.mjs.map
