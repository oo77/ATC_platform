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

    // ===== ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ =====
    console.log("[TG-App Auth] === ДЕТАЛЬНАЯ ДИАГНОСТИКА ===");
    console.log("[TG-App Auth] Тип body:", typeof body);
    console.log("[TG-App Auth] Ключи в body:", Object.keys(body || {}));
    console.log("[TG-App Auth] Тип initData:", typeof body?.initData);
    console.log("[TG-App Auth] Длина initData:", body?.initData?.length || 0);
    console.log(
      "[TG-App Auth] Первые 100 символов initData:",
      body?.initData?.substring(0, 100) || "отсутствует",
    );
    console.log(
      "[TG-App Auth] Есть ли 'hash' в строке?",
      body?.initData?.includes("hash="),
    );
    console.log(
      "[TG-App Auth] Есть ли 'user' в строке?",
      body?.initData?.includes("user="),
    );
    console.log("[TG-App Auth] Объект user в body:", body?.user);
    console.log("[TG-App Auth] ================================");

    const { initData, user: bodyUser } = body;

    let chatId: string = "";
    let telegramUser: any = null;

    // 1. Пробуем валидировать initData (Самый надежный способ)
    if (initData && initData !== "dev_mode") {
      console.log("[TG-App Auth] Попытка валидации initData...");
      const validatedData = validateWebAppData(initData);

      if (validatedData && validatedData.user) {
        console.log("[TG-App Auth] ✅ initData успешно проверена");
        telegramUser = validatedData.user;
        chatId = String(telegramUser.id);
      } else {
        console.warn(
          "[TG-App Auth] ❌ initData не прошла проверку подписи или некорректная",
        );
      }
    } else {
      console.warn("[TG-App Auth] initData отсутствует или равен 'dev_mode'");
    }

    // 2. Обработка режима разработки (Dev Mode)
    if (
      !chatId &&
      initData === "dev_mode" &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn(
        "[DEV MODE] Используем mock данные. InitData=dev_mode, ENV=development",
      );
      chatId = bodyUser?.id ? String(bodyUser.id) : "123456789";
      telegramUser = bodyUser || {
        id: "123456789",
        first_name: "Dev",
        last_name: "User",
      };
    }

    // 3. Если initData не прошла валидацию (или отсутствует), но есть user в body
    if (!chatId && bodyUser && bodyUser.id) {
      console.warn(
        "[TG-App Auth] ⚠️  ВНИМАНИЕ: Используем данные user из body (непроверенные)",
      );
      chatId = String(bodyUser.id);
      telegramUser = bodyUser;
    }

    if (!chatId) {
      console.error("[TG-App Auth] ❌ Не удалось определить chatId");
      console.error(
        "[TG-App Auth] initData было:",
        initData ? `"${initData.substring(0, 50)}..."` : "отсутствует",
      );
      console.error("[TG-App Auth] bodyUser было:", bodyUser);

      throw createError({
        statusCode: 400,
        message:
          "Не удалось идентифицировать пользователя (отсутствует или неверный initData)",
      });
    }

    console.log("[TG-App Auth] ✅ Итоговый chatId:", chatId);
    console.log("[TG-App Auth] Environment:", process.env.NODE_ENV);

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

    console.log("[TG-App Auth] ✅ Представитель найден:", representative.id);

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
