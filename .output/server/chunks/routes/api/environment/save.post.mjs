import { g as defineEventHandler, r as readBody, h as createError } from '../../../_/nitro.mjs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const save_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("[ENVIRONMENT] Saving environment variables...");
  try {
    const envPath = join(process.cwd(), ".env");
    const backupDir = join(process.cwd(), ".env-backups");
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }
    let envContent = "";
    try {
      envContent = await readFile(envPath, "utf-8");
    } catch {
      console.log("[ENVIRONMENT] .env file not found, creating new one");
    }
    if (envContent) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupPath = join(backupDir, `.env.backup.${timestamp}`);
      await writeFile(backupPath, envContent);
      console.log(`[ENVIRONMENT] Backup created: ${backupPath}`);
    }
    const updateEnvVar = (content, key, value) => {
      const escapedValue = value.replace(/\$/g, "\\$");
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${escapedValue}`);
      } else {
        return content.trim() + `
${key}=${escapedValue}
`;
      }
    };
    let newEnvContent = envContent;
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
      "AUTO_MIGRATE"
    ];
    for (const key of envVars) {
      if (body[key] !== void 0 && body[key] !== null) {
        newEnvContent = updateEnvVar(newEnvContent, key, String(body[key]));
      }
    }
    await writeFile(envPath, newEnvContent.trim() + "\n");
    console.log("[ENVIRONMENT] Environment variables saved successfully");
    return {
      success: true,
      message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E",
      note: "\u0414\u043B\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435"
    };
  } catch (error) {
    console.error("[ENVIRONMENT] Failed to save environment:", error);
    throw createError({
      statusCode: 500,
      message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A: ${error.message}`
    });
  }
});

export { save_post as default };
//# sourceMappingURL=save.post.mjs.map
