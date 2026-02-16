import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Сохранение настроек окружения в .env файл
 * POST /api/environment/save
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("[ENVIRONMENT] Saving environment variables...");

  try {
    const envPath = join(process.cwd(), ".env");
    const backupDir = join(process.cwd(), ".env-backups");

    // Создаём директорию для бэкапов если её нет
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    // Читаем текущий .env
    let envContent = "";
    try {
      envContent = await readFile(envPath, "utf-8");
    } catch {
      console.log("[ENVIRONMENT] .env file not found, creating new one");
    }

    // Создаём бэкап текущего .env
    if (envContent) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = join(backupDir, `.env.backup.${timestamp}`);
      await writeFile(backupPath, envContent);
      console.log(`[ENVIRONMENT] Backup created: ${backupPath}`);
    }

    // Функция обновления переменной в .env
    const updateEnvVar = (
      content: string,
      key: string,
      value: string,
    ): string => {
      const escapedValue = value.replace(/\$/g, "\\$"); // Экранируем $ символы
      const regex = new RegExp(`^${key}=.*$`, "m");

      if (regex.test(content)) {
        // Переменная существует - обновляем
        return content.replace(regex, `${key}=${escapedValue}`);
      } else {
        // Переменная не существует - добавляем
        return content.trim() + `\n${key}=${escapedValue}\n`;
      }
    };

    // Обновляем все переменные из body
    let newEnvContent = envContent;

    // Список всех возможных переменных
    const envVars = [
      // Database
      "DATABASE_HOST",
      "DATABASE_PORT",
      "DATABASE_NAME",
      "DATABASE_USER",
      "DATABASE_PASSWORD",

      // Application
      "APP_URL",
      "APP_NAME",
      "APP_TIMEZONE",

      // JWT (если переданы)
      "JWT_SECRET",
      "JWT_EXPIRES_IN",
      "REFRESH_TOKEN_SECRET",
      "REFRESH_TOKEN_EXPIRES_IN",

      // Telegram
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_WEBHOOK_SECRET",

      // OpenAI
      "OPENAI_API_KEY",
      "USE_OPENROUTER",
      "OPENAI_VISION_MODEL",
      "OPENAI_TEXT_MODEL",
      "OPENAI_MAX_TOKENS",
      "OPENAI_TEMPERATURE",

      // Other
      "NODE_ENV",
      "AUTO_MIGRATE",
    ];

    // Обновляем только те переменные, которые были переданы
    for (const key of envVars) {
      if (body[key] !== undefined && body[key] !== null) {
        newEnvContent = updateEnvVar(newEnvContent, key, String(body[key]));
      }
    }

    // Сохраняем обновлённый .env
    await writeFile(envPath, newEnvContent.trim() + "\n");

    console.log("[ENVIRONMENT] Environment variables saved successfully");

    return {
      success: true,
      message: "Настройки сохранены успешно",
      note: "Для применения изменений необходимо перезапустить приложение",
    };
  } catch (error: any) {
    console.error("[ENVIRONMENT] Failed to save environment:", error);

    throw createError({
      statusCode: 500,
      message: `Ошибка сохранения настроек: ${error.message}`,
    });
  }
});
