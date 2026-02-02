/**
 * API endpoint для авторизации в Telegram Mini App
 * Проверяет initData и возвращает данные представителя
 */

import { getRepresentativeByTelegramChatId } from "../../repositories/representativeRepository";
import { validateWebAppData } from "../../utils/telegramAuth";

export default defineEventHandler(async (event) => {
  try {
    console.log("[TG-App Auth] ====== Начало авторизации ======");
    const body = await readBody<{ initData: string }>(event);

    if (!body) {
      throw createError({
        statusCode: 400,
        message: "Отсутствуют данные в запросе",
      });
    }

    const { initData } = body;

    console.log(
      "[TG-App Auth] Получен initData длиной:",
      initData?.length || 0,
    );

    if (!initData) {
      console.warn("[TG-App Auth] initData отсутствует в запросе");
      throw createError({
        statusCode: 400,
        message: "Отсутствуют данные авторизации (initData)",
      });
    }

    // Выводим первые 200 символов для отладки
    console.log(
      "[TG-App Auth] initData (first 200 chars):",
      initData.substring(0, 200),
    );

    // Валидация initData
    console.log("[TG-App Auth] Начало валидации initData...");
    const validatedData = validateWebAppData(initData);

    if (!validatedData) {
      console.error("[TG-App Auth] ❌ Валидация initData провалилась");
      throw createError({
        statusCode: 401,
        message: "Не удалось подтвердить подлинность данных (неверная подпись)",
      });
    }

    console.log("[TG-App Auth] ✅ initData успешно валидирован");

    // Извлекаем user
    if (!validatedData.user) {
      console.error(
        "[TG-App Auth] ❌ user отсутствует в валидированных данных",
      );
      throw createError({
        statusCode: 400,
        message: "Не удалось получить данные пользователя из initData",
      });
    }

    const telegramUser = validatedData.user;
    const chatId = String(telegramUser.id);

    console.log("[TG-App Auth] ✅ Извлечен chatId:", chatId);
    console.log("[TG-App Auth] User info:", {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      username: telegramUser.username,
    });

    // Проверяем, существует ли представитель
    console.log("[TG-App Auth] Поиск представителя в базе...");
    const representative = await getRepresentativeByTelegramChatId(chatId);

    if (!representative) {
      console.warn(
        "[TG-App Auth] ⚠️ Представитель не найден для chatId:",
        chatId,
      );
      throw createError({
        statusCode: 404,
        message: "Пользователь не найден",
      });
    }

    console.log("[TG-App Auth] ✅ Представитель найден:", {
      id: representative.id,
      fullName: representative.fullName,
      status: representative.status,
    });

    // Возвращаем данные представителя
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
        lastActivityAt: representative.lastActivityAt,
      },
    };
  } catch (error: any) {
    console.error("[TG-App Auth] ❌ Ошибка авторизации:", error.message);
    console.error("[TG-App Auth] Stack:", error.stack);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера при авторизации",
    });
  }
});
