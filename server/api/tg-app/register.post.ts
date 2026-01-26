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
  try {
    const body = await readBody(event);
    const {
      initData,
      user: bodyUser, // Получаем объект user из тела запроса
      fullName,
      phone,
      organizationId,
      organizationName,
      username,
    } = body;

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

    let chatId: string = "";
    let telegramUser: any = null;

    // 1. Проверяем initData
    if (initData && initData !== "dev_mode") {
      const validatedData = validateWebAppData(initData);
      if (validatedData && validatedData.user) {
        telegramUser = validatedData.user;
        chatId = String(telegramUser.id);
      }
    }

    // 2. Dev Mode Fallback
    if (
      !chatId &&
      initData === "dev_mode" &&
      process.env.NODE_ENV === "development"
    ) {
      chatId = bodyUser?.id ? String(bodyUser.id) : "123456789";
      telegramUser = bodyUser;
    }

    // 3. Unsafe Fallback (как в auth.post.ts)
    if (!chatId && bodyUser && bodyUser.id) {
      console.warn("[TG-App Register] Using unsafe body user data");
      chatId = String(bodyUser.id);
      telegramUser = bodyUser;
    }

    if (!chatId) {
      throw createError({
        statusCode: 400,
        message: "Не удалось получить данные пользователя",
      });
    }

    console.log("[TG-App Register] Регистрация для chatId:", chatId);

    // Проверяем, не зарегистрирован ли уже
    const existing = await getRepresentativeByTelegramChatId(chatId);
    if (existing) {
      throw createError({
        statusCode: 409,
        message: "Вы уже зарегистрированы",
      });
    }

    // Получаем или создаём организацию
    let orgId = organizationId;
    if (!orgId) {
      const organization =
        await getOrCreateOrganizationByName(organizationName);
      orgId = organization.id;
    } else {
      // Проверяем, существует ли организация
      const organization = await getOrganizationById(orgId);
      if (!organization) {
        throw createError({
          statusCode: 404,
          message: "Организация не найдена",
        });
      }
    }

    // Создаём представителя
    const representative = await createRepresentative({
      fullName: fullName.trim(),
      phone: normalizedPhone,
      telegramChatId: chatId,
      telegramUsername: username || telegramUser?.username || null,
      organizationId: orgId,
    });

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
    console.error("[TG-App] Ошибка регистрации:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера",
    });
  }
});
