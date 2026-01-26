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
  if (!initData || !botToken) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");

    if (!hash) {
      console.warn(
        "[TelegramAuth] Validation Failed: 'hash' missing in initData",
      );
      console.debug("[TelegramAuth] Received initData:", initData);
      return null;
    }

    urlParams.delete("hash");

    // Сортируем ключи и создаем data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Создаем секретный ключ (HMAC-SHA-256 токена с ключом "WebAppData")
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Вычисляем hash от data-check-string
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      console.warn(`[TelegramAuth] Validation Failed: Hash mismatch.`);
      console.debug(
        `[TelegramAuth] Expected: ${calculatedHash}, Received: ${hash}`,
      );
      console.debug(
        `[TelegramAuth] Used Bot Token (first 5 chars): ${botToken.substring(0, 5)}...`,
      );
      return null;
    }

    console.log(
      "[TelegramAuth] Validation Successful for user:",
      Object.fromEntries(urlParams).user,
    );

    // Парсим user, если есть
    const result: Record<string, any> = {};
    for (const [key, value] of urlParams.entries()) {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    }
    return result;
  } catch (error) {
    console.error("[TelegramAuth] Ошибка валидации:", error);
    return null;
  }
}
