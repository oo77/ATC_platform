/**
 * GET /api/telegram/webhook-info
 * Получение информации о текущем webhook
 */

import { defineEventHandler, createError } from 'h3';
import { getBot } from '../../utils/telegramBot';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию через middleware
  const user = event.context.user;
  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещён. Требуются права администратора.',
    });
  }

  try {
    const bot = getBot();
    if (!bot) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Telegram бот не инициализирован. Проверьте TELEGRAM_BOT_TOKEN.',
      });
    }

    // Получаем информацию о боте
    const botInfo = await bot.api.getMe();
    
    // Получаем информацию о webhook
    const webhookInfo = await bot.api.getWebhookInfo();

    return {
      success: true,
      bot: {
        id: botInfo.id,
        firstName: botInfo.first_name,
        username: botInfo.username,
        canJoinGroups: botInfo.can_join_groups,
        canReadAllGroupMessages: botInfo.can_read_all_group_messages,
        supportsInlineQueries: botInfo.supports_inline_queries,
      },
      webhook: {
        url: webhookInfo.url || null,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        ipAddress: webhookInfo.ip_address,
        lastErrorDate: webhookInfo.last_error_date
          ? new Date(webhookInfo.last_error_date * 1000).toISOString()
          : null,
        lastErrorMessage: webhookInfo.last_error_message || null,
        lastSynchronizationErrorDate: webhookInfo.last_synchronization_error_date
          ? new Date(webhookInfo.last_synchronization_error_date * 1000).toISOString()
          : null,
        maxConnections: webhookInfo.max_connections,
        allowedUpdates: webhookInfo.allowed_updates,
      },
    };
    
  } catch (error: any) {
    console.error('[Telegram Info] Ошибка получения информации:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка получения информации о боте',
    });
  }
});
