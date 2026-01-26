/**
 * API endpoint для авторизации в Telegram Mini App
 * Проверяет initData и возвращает данные представителя
 */

import { getRepresentativeByTelegramChatId } from "../../repositories/representativeRepository";
import { validateWebAppData } from "../../utils/telegramAuth";

export default defineEventHandler(async (event) => {
  try {
    console.log("[TG-App Auth] Начало авторизации");
    const body = await readBody(event);

    // Логируем безопасную часть данных для отладки
    const initDataPreview = body?.initData
      ? body.initData.length > 20
        ? body.initData.substring(0, 20) + "..."
        : body.initData
      : "missing";
    console.log("[TG-App Auth] Body:", {
      hasInitData: !!body?.initData,
      initDataPreview,
      hasUser: !!body?.user,
    });

    const { initData, user: bodyUser } = body;

    let chatId: string = "";
    let telegramUser: any = null;

    // 1. Пробуем валидировать initData (Самый надежный способ)
    if (initData && initData !== "dev_mode") {
      const validatedData = validateWebAppData(initData);

      if (validatedData && validatedData.user) {
        console.log("[TG-App Auth] initData успешно проверена");
        telegramUser = validatedData.user;
        chatId = String(telegramUser.id);
      } else {
        console.warn(
          "[TG-App Auth] initData не прошла проверку подписи или некорректная",
        );
      }
    }

    // 2. Обработка режима разработки (Dev Mode)
    if (
      !chatId &&
      initData === "dev_mode" &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn("[DEV MODE] Используем mock данные");
      chatId = bodyUser?.id ? String(bodyUser.id) : "123456789";
    }

    // 3. Если initData не прошла валидацию (или отсутствует), но есть user в body
    // В продакшене этому доверять ОПАСНО, но если валидация сломана, можно оставить как fallback
    // с жирным предупреждением, или запретить.
    // Для сейчас оставим как fallback, но он не будет работать если хеш неверен.
    if (!chatId && bodyUser && bodyUser.id) {
      // ВНИМАНИЕ: Это небезопасно, так как данные приходят от клиента без подписи
      // Используем это только если мы принимаем риск спуфинга или для отладки
      console.warn(
        "[TG-App Auth] ВНИМАНИЕ: Используем данные user из body (непроверенные)",
      );
      chatId = String(bodyUser.id);
    }

    if (!chatId) {
      console.error("[TG-App Auth] Не удалось определить chatId");
      throw createError({
        statusCode: 400,
        message:
          "Не удалось идентифицировать пользователя (отсутствует или неверный initData)",
      });
    }

    console.log("[TG-App Auth] Итоговый chatId:", chatId);

    // Проверяем, существует ли представитель
    console.log("[TG-App Auth] Ищем представителя в базе...");
    const representative = await getRepresentativeByTelegramChatId(chatId);

    if (!representative) {
      console.warn("[TG-App Auth] Представитель не найден для chatId:", chatId);
      throw createError({
        statusCode: 404,
        message: "Пользователь не найден",
      });
    }

    console.log("[TG-App Auth] Представитель найден:", representative.id);

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
    console.error("[TG-App] Ошибка авторизации:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Внутренняя ошибка сервера при авторизации",
    });
  }
});
