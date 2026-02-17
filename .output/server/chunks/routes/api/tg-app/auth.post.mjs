import { g as defineEventHandler, r as readBody, h as createError, a9 as getRepresentativeByTelegramChatId } from '../../../_/nitro.mjs';
import { v as validateWebAppData } from '../../../_/telegramAuth.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const auth_post = defineEventHandler(async (event) => {
  try {
    console.log("[TG-App Auth] ====== \u041D\u0430\u0447\u0430\u043B\u043E \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438 ======");
    const body = await readBody(event);
    if (!body) {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
      });
    }
    const { initData } = body;
    console.log(
      "[TG-App Auth] \u041F\u043E\u043B\u0443\u0447\u0435\u043D initData \u0434\u043B\u0438\u043D\u043E\u0439:",
      initData?.length || 0
    );
    if (!initData) {
      console.warn("[TG-App Auth] initData \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435");
      throw createError({
        statusCode: 400,
        message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438 (initData)"
      });
    }
    console.log(
      "[TG-App Auth] initData (first 200 chars):",
      initData.substring(0, 200)
    );
    console.log("[TG-App Auth] \u041D\u0430\u0447\u0430\u043B\u043E \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 initData...");
    const validatedData = validateWebAppData(initData);
    if (!validatedData) {
      console.error("[TG-App Auth] \u274C \u0412\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F initData \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u043B\u0430\u0441\u044C");
      throw createError({
        statusCode: 401,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u043F\u043E\u0434\u043B\u0438\u043D\u043D\u043E\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 (\u043D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u044C)"
      });
    }
    console.log("[TG-App Auth] \u2705 initData \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0432\u0430\u043B\u0438\u0434\u0438\u0440\u043E\u0432\u0430\u043D");
    if (!validatedData.user) {
      console.error(
        "[TG-App Auth] \u274C user \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u0432\u0430\u043B\u0438\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445"
      );
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0438\u0437 initData"
      });
    }
    const telegramUser = validatedData.user;
    const chatId = String(telegramUser.id);
    console.log("[TG-App Auth] \u2705 \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D chatId:", chatId);
    console.log("[TG-App Auth] User info:", {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      username: telegramUser.username
    });
    console.log("[TG-App Auth] \u041F\u043E\u0438\u0441\u043A \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u0432 \u0431\u0430\u0437\u0435...");
    const representative = await getRepresentativeByTelegramChatId(chatId);
    if (!representative) {
      console.warn(
        "[TG-App Auth] \u26A0\uFE0F \u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0434\u043B\u044F chatId:",
        chatId
      );
      throw createError({
        statusCode: 404,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    console.log("[TG-App Auth] \u2705 \u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043D\u0430\u0439\u0434\u0435\u043D:", {
      id: representative.id,
      fullName: representative.fullName,
      status: representative.status
    });
    return {
      success: true,
      representative: {
        id: representative.id,
        fullName: representative.fullName,
        phone: representative.phone,
        telegramChatId: representative.telegramChatId,
        telegramUsername: representative.telegramUsername,
        organizationId: representative.organizationId,
        organizationName: representative.organizationName,
        status: representative.status,
        blockedReason: representative.blockedReason,
        permissions: representative.permissions,
        createdAt: representative.createdAt,
        approvedAt: representative.approvedAt,
        lastActivityAt: representative.lastActivityAt
      }
    };
  } catch (error) {
    console.error("[TG-App Auth] \u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438:", error.message);
    console.error("[TG-App Auth] Stack:", error.stack);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { auth_post as default };
//# sourceMappingURL=auth.post.mjs.map
