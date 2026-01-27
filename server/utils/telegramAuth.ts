import crypto from "crypto";

/**
 * Валидация данных инициализации Telegram Mini App (initData)
 * @param initData Строка initData, полученная от Telegram
 * @param botToken Токен бота
 * @returns { user: any, authDate: number, chat?: any, ... } или null, если валидация не прошла
 */
export function validateWebAppData(
  initData: string,
  botToken: string = process.env.TELEGRAM_BOT_TOKEN || "",
) {
  if (!initData || !botToken) {
    console.error(
      "[TelegramAuth] Validation Failed: Missing initData or botToken",
    );
    return null;
  }

  try {
    console.log("[TelegramAuth] Starting validation...");
    console.log("[TelegramAuth] initData length:", initData.length);
    console.log(
      "[TelegramAuth] Bot token (first 10 chars):",
      botToken.substring(0, 10) + "...",
    );

    // Парсим параметры из initData
    const urlParams = new URLSearchParams(initData);

    // Получаем hash
    const hash = urlParams.get("hash");
    if (!hash) {
      console.warn(
        "[TelegramAuth] Validation Failed: 'hash' missing in initData",
      );
      console.debug(
        "[TelegramAuth] Available params:",
        Array.from(urlParams.keys()).join(", "),
      );
      console.debug(
        "[TelegramAuth] First 200 chars of initData:",
        initData.substring(0, 200),
      );
      return null;
    }

    console.log("[TelegramAuth] Hash found:", hash.substring(0, 20) + "...");

    // Удаляем hash для создания data-check-string
    urlParams.delete("hash");

    // Сортируем ключи и создаем data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    console.log(
      "[TelegramAuth] Data-check-string created, length:",
      dataCheckString.length,
    );
    console.log(
      "[TelegramAuth] Data-check-string (first 200 chars):",
      dataCheckString.substring(0, 200),
    );

    // Создаем секретный ключ (HMAC-SHA-256 токена с ключом "WebAppData")
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    console.log("[TelegramAuth] Secret key generated");

    // Вычисляем hash от data-check-string
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    console.log("[TelegramAuth] Calculated hash:", calculatedHash);
    console.log("[TelegramAuth] Received hash:  ", hash);

    if (calculatedHash !== hash) {
      console.warn("[TelegramAuth] ❌ Validation Failed: Hash mismatch");
      console.debug("[TelegramAuth] Expected:", calculatedHash);
      console.debug("[TelegramAuth] Received: ", hash);
      console.debug(
        "[TelegramAuth] Bot Token (first 5 chars):",
        botToken.substring(0, 5) + "...",
      );
      return null;
    }

    console.log("[TelegramAuth] ✅ Hash validation successful!");

    // Парсим все параметры и декодируем JSON там, где нужно
    const result: Record<string, any> = {};
    for (const [key, value] of urlParams.entries()) {
      try {
        // Для user, chat и других JSON-параметров пробуем распарсить
        if (key === "user" || key === "chat" || key === "receiver") {
          // Декодируем URL-encoded значение
          const decodedValue = decodeURIComponent(value);
          result[key] = JSON.parse(decodedValue);
        } else {
          result[key] = value;
        }
      } catch {
        // Если не JSON, оставляем как есть
        result[key] = value;
      }
    }

    console.log(
      "[TelegramAuth] ✅ Validation successful for user:",
      result.user?.id,
    );

    return result;
  } catch (error) {
    console.error("[TelegramAuth] ❌ Ошибка валидации:", error);
    console.error(
      "[TelegramAuth] Stack:",
      error instanceof Error ? error.stack : "",
    );
    return null;
  }
}
