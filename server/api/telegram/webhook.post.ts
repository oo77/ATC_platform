/**
 * POST /api/telegram/webhook
 * Webhook endpoint для получения обновлений от Telegram Bot API
 */

import { defineEventHandler, readBody, getHeader, createError } from 'h3';
import { handleUpdate } from '../../services/telegramBotService';
import { verifyWebhookSecret } from '../../utils/telegramBot';

export default defineEventHandler(async (event) => {
  const startTime = Date.now();
  
  try {
    // Проверяем секрет webhook (опционально)
    const webhookSecret = getHeader(event, 'x-telegram-bot-api-secret-token');
    if (webhookSecret && !verifyWebhookSecret(webhookSecret)) {
      console.warn('[Telegram Webhook] Неверный секрет webhook');
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    // Получаем тело запроса
    const update = await readBody(event);

    if (!update || typeof update !== 'object') {
      console.warn('[Telegram Webhook] Пустое или невалидное тело запроса');
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
      });
    }

    console.log(`[Telegram Webhook] Получено обновление #${update.update_id}`);

    // Обрабатываем обновление асинхронно
    // Telegram ожидает быстрый ответ (< 60 секунд), поэтому не ждём завершения обработки
    handleUpdate(update).catch((error) => {
      console.error('[Telegram Webhook] Ошибка обработки:', error);
    });

    const duration = Date.now() - startTime;
    console.log(`[Telegram Webhook] Ответ отправлен за ${duration}ms`);

    // Telegram ожидает пустой ответ с кодом 200
    return { ok: true };
    
  } catch (error: any) {
    console.error('[Telegram Webhook] Ошибка:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
