/**
 * Получение текущих значений ENV переменных
 * GET /api/environment/current
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Возвращаем текущие значения (без секретов в полном виде)
  return {
    database: {
      DATABASE_HOST: process.env.DATABASE_HOST || "",
      DATABASE_PORT: process.env.DATABASE_PORT || "3306",
      DATABASE_NAME: process.env.DATABASE_NAME || "",
      DATABASE_USER: process.env.DATABASE_USER || "",
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? "••••••••" : "", // Маскируем пароль
    },
    application: {
      APP_URL: process.env.APP_URL || "",
      APP_NAME: process.env.APP_NAME || "ATC Platform",
      APP_TIMEZONE: process.env.APP_TIMEZONE || "Asia/Almaty",
      NODE_ENV: process.env.NODE_ENV || "production",
      AUTO_MIGRATE: process.env.AUTO_MIGRATE || "false",
    },
    jwt: {
      JWT_SECRET: process.env.JWT_SECRET ? "••••••••" : "",
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ? "••••••••" : "",
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
    },
    telegram: {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? "••••••••" : "",
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET
        ? "••••••••"
        : "",
    },
    openai: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "••••••••" : "",
      USE_OPENROUTER: process.env.USE_OPENROUTER || "true",
      OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL || "openai/gpt-4o",
      OPENAI_TEXT_MODEL:
        process.env.OPENAI_TEXT_MODEL || "openai/gpt-3.5-turbo",
      OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS || "1500",
      OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE || "0.1",
    },
  };
});
