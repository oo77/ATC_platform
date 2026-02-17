import crypto from 'crypto';

function validateWebAppData(initData, botToken = process.env.TELEGRAM_BOT_TOKEN || "") {
  if (!initData || !botToken) {
    console.error(
      "[TelegramAuth] Validation Failed: Missing initData or botToken"
    );
    return null;
  }
  try {
    console.log("[TelegramAuth] Starting validation...");
    console.log("[TelegramAuth] initData length:", initData.length);
    console.log(
      "[TelegramAuth] Bot token (first 10 chars):",
      botToken.substring(0, 10) + "..."
    );
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) {
      console.warn(
        "[TelegramAuth] Validation Failed: 'hash' missing in initData"
      );
      console.debug(
        "[TelegramAuth] Available params:",
        Array.from(urlParams.keys()).join(", ")
      );
      console.debug(
        "[TelegramAuth] First 200 chars of initData:",
        initData.substring(0, 200)
      );
      return null;
    }
    console.log("[TelegramAuth] Hash found:", hash.substring(0, 20) + "...");
    urlParams.delete("hash");
    const dataCheckString = Array.from(urlParams.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("\n");
    console.log(
      "[TelegramAuth] Data-check-string created, length:",
      dataCheckString.length
    );
    console.log(
      "[TelegramAuth] Data-check-string (first 200 chars):",
      dataCheckString.substring(0, 200)
    );
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    console.log("[TelegramAuth] Secret key generated");
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    console.log("[TelegramAuth] Calculated hash:", calculatedHash);
    console.log("[TelegramAuth] Received hash:  ", hash);
    if (calculatedHash !== hash) {
      console.warn("[TelegramAuth] \u274C Validation Failed: Hash mismatch");
      console.debug("[TelegramAuth] Expected:", calculatedHash);
      console.debug("[TelegramAuth] Received: ", hash);
      console.debug(
        "[TelegramAuth] Bot Token (first 5 chars):",
        botToken.substring(0, 5) + "..."
      );
      return null;
    }
    console.log("[TelegramAuth] \u2705 Hash validation successful!");
    const result = {};
    for (const [key, value] of urlParams.entries()) {
      try {
        if (key === "user" || key === "chat" || key === "receiver") {
          const decodedValue = decodeURIComponent(value);
          result[key] = JSON.parse(decodedValue);
        } else {
          result[key] = value;
        }
      } catch {
        result[key] = value;
      }
    }
    console.log(
      "[TelegramAuth] \u2705 Validation successful for user:",
      result.user?.id
    );
    return result;
  } catch (error) {
    console.error("[TelegramAuth] \u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438:", error);
    console.error(
      "[TelegramAuth] Stack:",
      error instanceof Error ? error.stack : ""
    );
    return null;
  }
}

export { validateWebAppData as v };
//# sourceMappingURL=telegramAuth.mjs.map
