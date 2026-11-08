/**
 * POST /api/telegram/send
 * Отправка сообщения напрямую в Telegram чат
 * Для тестирования и уведомлений
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { sendMessage } from '../../utils/telegramBot';
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.SETTINGS_MANAGE);


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
