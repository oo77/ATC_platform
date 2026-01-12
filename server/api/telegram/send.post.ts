/**
 * POST /api/telegram/send
 * Отправка сообщения напрямую в Telegram чат
 * Для тестирования и уведомлений
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { sendMessage } from '../../utils/telegramBot';

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
    const { chatId, message } = body || {};

    if (!chatId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Укажите chatId',
      });
    }

    if (!message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Укажите message',
      });
    }

    console.log(`[Telegram Send] Отправка в chatId=${chatId}: ${message.substring(0, 50)}...`);

    const result = await sendMessage(chatId, message);

    if (result) {
      return {
        success: true,
        message: 'Сообщение успешно отправлено',
      };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось отправить сообщение. Проверьте токен бота и chatId.',
      });
    }
    
  } catch (error: any) {
    console.error('[Telegram Send] Ошибка:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Ошибка отправки сообщения',
    });
  }
});
