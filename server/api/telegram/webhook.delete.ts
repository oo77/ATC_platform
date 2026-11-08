/**
 * DELETE /api/telegram/webhook
 * Удаление webhook (переключение на polling)
 */

import { defineEventHandler, createError } from 'h3';
import { getBot } from '../../utils/telegramBot';
import { logActivity } from '../../utils/activityLogger';
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.SETTINGS_MANAGE);


  try {
    const bot = getBot();
    if (!bot) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Telegram бот не инициализирован. Проверьте TELEGRAM_BOT_TOKEN.',
      });
    }

    // Удаляем webhook
    await bot.api.deleteWebhook({ drop_pending_updates: true });

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'SYSTEM',
      'telegram_bot',
      'Telegram Bot Webhook',
      {}
    );

    console.log('[Telegram Setup] Webhook удалён');

    return {
      success: true,
      message: 'Webhook успешно удалён',
    };
    
  } catch (error: any) {
    console.error('[Telegram Setup] Ошибка удаления webhook:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка удаления webhook',
    });
  }
});
