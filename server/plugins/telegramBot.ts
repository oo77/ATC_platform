/**
 * Nitro Plugin - Запуск Telegram бота в режиме Long Polling
 * Автоматически запускается при старте сервера в dev режиме
 */

import { Bot } from 'grammy';
import { handleUpdate } from '../services/telegramBotService';

let pollingBot: Bot | null = null;
let isPollingActive = false;

export default defineNitroPlugin(async (nitroApp) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('[TelegramBot] ⚠️ TELEGRAM_BOT_TOKEN не задан, бот не запущен');
    return;
  }

  // Запускаем polling только в dev режиме
  // В production используется webhook
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (!isDev) {
    console.log('[TelegramBot] 📡 Production режим - используйте webhook');
    return;
  }

  try {
    console.log('[TelegramBot] 🚀 Запуск бота в режиме Long Polling...');
    
    // Создаём новый экземпляр бота для polling
    pollingBot = new Bot(token);
    
    // Получаем информацию о боте
    const botInfo = await pollingBot.api.getMe();
    console.log(`[TelegramBot] ✅ Бот подключен: @${botInfo.username}`);

    // Удаляем webhook если был установлен (polling и webhook несовместимы)
    await pollingBot.api.deleteWebhook({ drop_pending_updates: true });
    console.log('[TelegramBot] 🔄 Webhook удалён, переключаемся на polling');

    // Обработчик всех сообщений
    pollingBot.on('message', async (ctx) => {
      try {
        const update = {
          update_id: ctx.update.update_id,
          message: ctx.update.message,
        };
        await handleUpdate(update);
      } catch (error) {
        console.error('[TelegramBot] Ошибка обработки сообщения:', error);
      }
    });

    // Обработчик callback query (inline кнопки)
    pollingBot.on('callback_query', async (ctx) => {
      try {
        const update = {
          update_id: ctx.update.update_id,
          callback_query: ctx.update.callback_query,
        };
        await handleUpdate(update);
      } catch (error) {
        console.error('[TelegramBot] Ошибка обработки callback:', error);
      }
    });

    // Запускаем polling
    isPollingActive = true;
    pollingBot.start({
      onStart: (botInfo) => {
        console.log(`[TelegramBot] 🤖 Бот запущен и готов к работе!`);
        console.log(`[TelegramBot] 📱 Откройте Telegram и найдите: @${botInfo.username}`);
        console.log(`[TelegramBot] 💬 Отправьте /start для начала`);
      },
    });

    // Обработка ошибок polling
    pollingBot.catch((err) => {
      console.error('[TelegramBot] Ошибка polling:', err);
    });

  } catch (error) {
    console.error('[TelegramBot] ❌ Ошибка запуска бота:', error);
  }

  // Graceful shutdown
  nitroApp.hooks.hook('close', async () => {
    if (pollingBot && isPollingActive) {
      console.log('[TelegramBot] 🛑 Остановка бота...');
      await pollingBot.stop();
      isPollingActive = false;
      console.log('[TelegramBot] ✅ Бот остановлен');
    }
  });
});

/**
 * Экспорт для возможности остановки извне
 */
export function stopPolling() {
  if (pollingBot && isPollingActive) {
    pollingBot.stop();
    isPollingActive = false;
    pollingBot = null;
  }
}

export function isPolling() {
  return isPollingActive;
}
