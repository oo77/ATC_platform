/**
 * API endpoint для регистрации представителя через Telegram Mini App
 */

import {
  createRepresentative,
  getRepresentativeByTelegramChatId,
} from "../../repositories/representativeRepository";
import {
  getOrganizationById,
  getOrCreateOrganizationByName,
} from "../../repositories/organizationRepository";
import {
  validateName,
  validatePhone,
  normalizePhone,
} from "../../utils/telegramBot";
import { validateWebAppData } from "../../utils/telegramAuth";

export default defineEventHandler(async (event) => {
  console.log("[TG-App Register] ====== Request received ======");
  console.log("[TG-App Register] ENV:", process.env.NODE_ENV);

  try {
    const body = await readBody(event);
    const {
      initData,
      fullName,
      phone,
      organizationId,
      organizationName,
      username,
    } = body;

    console.log("[TG-App Register] Received data:", {
      hasInitData: !!initData,
      initDataLength: initData?.length || 0,
      fullName,
      phone,
      organizationId,
      organizationName,
      username,
    });

    // Валидация
    if (!initData) {
      throw createError({
        statusCode: 400,
        message: "initData обязателен",
      });
    }

    if (!fullName || !validateName(fullName)) {
      throw createError({
        statusCode: 400,
        message: "Неверный формат ФИО",
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!validatePhone(normalizedPhone)) {
      throw createError({
        statusCode: 400,
        message: "Неверный формат телефона",
      });
    }

    if (!organizationId && !organizationName) {
      throw createError({
        statusCode: 400,
        message: "Необходимо указать организацию",
      });
    }

    // Валидация initData
    console.log("[TG-App Register] Начало валидации initData...");
    const validatedData = validateWebAppData(initData);

    if (!validatedData || !validatedData.user) {
      console.error("[TG-App Register] ❌ Валидация initData провалилась");
      throw createError({
        statusCode: 401,
        message: "Не удалось подтвердить подлинность данных (неверная подпись)",
      });
    }

    console.log("[TG-App Register] ✅ initData валидирован успешно");

    const telegramUser = validatedData.user;
    const chatId = String(telegramUser.id);

    console.log("[TG-App Register] Регистрация для chatId:", chatId);
    console.log("[TG-App Register] User info:", {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      username: telegramUser.username,
    });

    // Проверяем, не зарегистрирован ли уже
    const existing = await getRepresentativeByTelegramChatId(chatId);
    if (existing) {
      console.warn(
        "[TG-App Register] ⚠️ Пользователь уже зарегистрирован:",
        chatId,
      );
      throw createError({
        statusCode: 409,
        message: "Вы уже зарегистрированы",
      });
    }

    // Получаем или создаём организацию
    let orgId = organizationId;
    if (!orgId) {
      console.log(
        "[TG-App Register] Создание/поиск организации:",
        organizationName,
      );
      const organization =
        await getOrCreateOrganizationByName(organizationName);
      orgId = organization.id;
      console.log("[TG-App Register] Организация ID:", orgId);
    } else {
      // Проверяем, существует ли организация
      const organization = await getOrganizationById(orgId);
      if (!organization) {
        console.error("[TG-App Register] ❌ Организация не найдена:", orgId);
        throw createError({
          statusCode: 404,
          message: "Организация не найдена",
        });
      }
    }

    // Создаём представителя
    console.log("[TG-App Register] Создание представителя...");
    const representative = await createRepresentative({
      fullName: fullName.trim(),
      phone: normalizedPhone,
      telegramChatId: chatId,
      telegramUsername: username || telegramUser?.username || null,
      organizationId: orgId,
    });

    console.log(
      "[TG-App Register] ✅ Представитель успешно создан:",
      representative.id,
    );

    return {
      success: true,
      message: "Заявка успешно отправлена",
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
        createdAt: representative.createdAt,
      },
    };
  } catch (error: any) {
    console.error("[TG-App Register] ❌ Ошибка регистрации:", error.message);
    console.error("[TG-App Register] Stack:", error.stack);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера",
    });
  }
});
