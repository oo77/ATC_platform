import { g as defineEventHandler, r as readBody, h as createError, ab as validateName, ac as normalizePhone, ad as validatePhone, a9 as getRepresentativeByTelegramChatId, z as getOrCreateOrganizationByName, M as getOrganizationById, ae as createRepresentative } from '../../../_/nitro.mjs';
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

const register_post = defineEventHandler(async (event) => {
  console.log("[TG-App Register] ====== Request received ======");
  console.log("[TG-App Register] ENV:", "production");
  try {
    const body = await readBody(event);
    if (!body) {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
      });
    }
    const {
      initData,
      fullName,
      phone,
      organizationId,
      organizationName,
      username
    } = body;
    console.log("[TG-App Register] Received data:", {
      hasInitData: !!initData,
      initDataLength: initData?.length || 0,
      fullName,
      phone,
      organizationId,
      organizationName,
      username
    });
    if (!initData) {
      throw createError({
        statusCode: 400,
        message: "initData \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    if (!fullName || !validateName(fullName)) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0424\u0418\u041E"
      });
    }
    const normalizedPhone = normalizePhone(phone);
    if (!validatePhone(normalizedPhone)) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430"
      });
    }
    if (!organizationId && !organizationName) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E"
      });
    }
    console.log("[TG-App Register] \u041D\u0430\u0447\u0430\u043B\u043E \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 initData...");
    const validatedData = validateWebAppData(initData);
    if (!validatedData || !validatedData.user) {
      console.error("[TG-App Register] \u274C \u0412\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F initData \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u043B\u0430\u0441\u044C");
      throw createError({
        statusCode: 401,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u043F\u043E\u0434\u043B\u0438\u043D\u043D\u043E\u0441\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0445 (\u043D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u044C)"
      });
    }
    console.log("[TG-App Register] \u2705 initData \u0432\u0430\u043B\u0438\u0434\u0438\u0440\u043E\u0432\u0430\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E");
    const telegramUser = validatedData.user;
    const chatId = String(telegramUser.id);
    console.log("[TG-App Register] \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0434\u043B\u044F chatId:", chatId);
    console.log("[TG-App Register] User info:", {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      username: telegramUser.username
    });
    const existing = await getRepresentativeByTelegramChatId(chatId);
    if (existing) {
      console.warn(
        "[TG-App Register] \u26A0\uFE0F \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D:",
        chatId
      );
      throw createError({
        statusCode: 409,
        message: "\u0412\u044B \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B"
      });
    }
    let orgId = organizationId ? String(organizationId) : "";
    if (!orgId) {
      console.log(
        "[TG-App Register] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435/\u043F\u043E\u0438\u0441\u043A \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438:",
        organizationName
      );
      const organization = await getOrCreateOrganizationByName(
        organizationName
      );
      orgId = organization.id;
      console.log("[TG-App Register] \u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F ID:", orgId);
    } else {
      const organization = await getOrganizationById(orgId);
      if (!organization) {
        console.error("[TG-App Register] \u274C \u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430:", orgId);
        throw createError({
          statusCode: 404,
          message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        });
      }
    }
    console.log("[TG-App Register] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F...");
    const representative = await createRepresentative({
      fullName: fullName.trim(),
      phone: normalizedPhone,
      telegramChatId: chatId,
      telegramUsername: username || telegramUser?.username || void 0,
      organizationId: orgId
    });
    console.log(
      "[TG-App Register] \u2705 \u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D:",
      representative.id
    );
    return {
      success: true,
      message: "\u0417\u0430\u044F\u0432\u043A\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430",
      representative: {
        id: representative.id,
        fullName: representative.fullName,
        phone: representative.phone,
        telegramUsername: representative.telegramUsername,
        telegramChatId: representative.telegramChatId,
        organizationId: representative.organizationId,
        organizationName: representative.organizationName,
        status: representative.status,
        permissions: representative.permissions,
        createdAt: representative.createdAt
      }
    };
  } catch (error) {
    console.error("[TG-App Register] \u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438:", error.message);
    console.error("[TG-App Register] Stack:", error.stack);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { register_post as default };
//# sourceMappingURL=register.post.mjs.map
