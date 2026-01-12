import { d as defineEventHandler, c as createError, r as readBody, L as sendMessage } from '../../../nitro/nitro.mjs';
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

const send_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D. \u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430."
    });
  }
  try {
    const body = await readBody(event);
    const { chatId, message } = body || {};
    if (!chatId) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 chatId"
      });
    }
    if (!message) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 message"
      });
    }
    console.log(`[Telegram Send] \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0432 chatId=${chatId}: ${message.substring(0, 50)}...`);
    const result = await sendMessage(chatId, message);
    if (result) {
      return {
        success: true,
        message: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E"
      };
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0442\u043E\u043A\u0435\u043D \u0431\u043E\u0442\u0430 \u0438 chatId."
      });
    }
  } catch (error) {
    console.error("[Telegram Send] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
    });
  }
});

export { send_post as default };
//# sourceMappingURL=send.post.mjs.map
