/**
 * POST /api/telegram/setup-webhook
 * Установка webhook URL в Telegram Bot API
 * Вызывается администратором для настройки бота
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { getBot } from '../../utils/telegramBot';
import { logActivity } from '../../utils/activityLogger';

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
    const body = await readBody(event);
    const { webhookUrl, dropPendingUpdates = true } = body || {};

    if (!webhookUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Не указан URL webhook',
      });
    }

    // Валидация URL
    try {
      const url = new URL(webhookUrl);
      if (url.protocol !== 'https:') {
        throw new Error('Webhook URL должен использовать HTTPS');
      }
    } catch (urlError: any) {
      throw createError({
        statusCode: 400,
        statusMessage: urlError.message || 'Невалидный URL',
      });
    }

    const bot = getBot();
    if (!bot) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Telegram бот не инициализирован. Проверьте TELEGRAM_BOT_TOKEN.',
      });
    }

    // Получаем секрет из переменных окружения
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || undefined;

    // Устанавливаем webhook
    await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: dropPendingUpdates,
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
    });

    // Получаем информацию о webhook для подтверждения
    const webhookInfo = await bot.api.getWebhookInfo();

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'SYSTEM',
      'telegram_bot',
      'Telegram Bot Webhook',
      {
        webhookUrl,
        dropPendingUpdates,
        hasSecretToken: !!secretToken,
      }
    );

    console.log(`[Telegram Setup] Webhook установлен: ${webhookUrl}`);

    return {
      success: true,
      message: 'Webhook успешно установлен',
      webhookInfo: {
        url: webhookInfo.url,
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message,
        maxConnections: webhookInfo.max_connections,
        allowedUpdates: webhookInfo.allowed_updates,
      },
    };
    
  } catch (error: any) {
    console.error('[Telegram Setup] Ошибка установки webhook:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка установки webhook',
    });
  }
});
