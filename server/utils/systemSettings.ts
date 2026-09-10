import { getDbPool } from "./db";
import type { RowDataPacket } from "mysql2/promise";

export interface SettingItem {
  id: string;
  value: string | null;
  category: string;
  description: string | null;
  isSecret: boolean;
}

interface SettingRow extends RowDataPacket {
  id: string;
  value: string | null;
  category: string;
  description: string | null;
  is_secret: number;
}

// In-memory кэш для максимальной скорости чтения
const settingsCache = new Map<string, SettingItem>();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Категории настроек по умолчанию для известных ключей
const KEY_METADATA: Record<string, { category: string; description: string; isSecret: boolean }> = {
  // Course Planner 2
  COURSE_PLANNER_URL: { category: "course_planner", description: "URL сервера Course Planner 2", isSecret: false },
  COURSE_PLANNER_API_TOKEN: { category: "course_planner", description: "API токен для обращения к Course Planner 2", isSecret: true },
  COURSE_PLANNER_ENABLED: { category: "course_planner", description: "Флаг активности интеграции с Course Planner 2", isSecret: false },
  PLANNER_API_TOKEN: { category: "course_planner", description: "Токен входящих запросов от Course Planner 2", isSecret: true },

  // Application
  APP_NAME: { category: "application", description: "Название платформы", isSecret: false },
  APP_URL: { category: "application", description: "Публичный URL приложения", isSecret: false },
  APP_TIMEZONE: { category: "application", description: "Часовой пояс приложения", isSecret: false },
  NODE_ENV: { category: "application", description: "Режим окружения", isSecret: false },
  AUTO_MIGRATE: { category: "application", description: "Автоматическое применение миграций", isSecret: false },

  // Telegram
  TELEGRAM_BOT_TOKEN: { category: "telegram", description: "Токен Telegram бота", isSecret: true },
  TELEGRAM_WEBHOOK_SECRET: { category: "telegram", description: "Секрет Telegram вебхука", isSecret: true },

  // Security / JWT
  JWT_SECRET: { category: "security", description: "Секретный ключ JWT", isSecret: true },
  JWT_EXPIRES_IN: { category: "security", description: "Срок действия JWT", isSecret: false },
  REFRESH_TOKEN_SECRET: { category: "security", description: "Секретный ключ Refresh токена", isSecret: true },
  REFRESH_TOKEN_EXPIRES_IN: { category: "security", description: "Срок действия Refresh токена", isSecret: false },

  // Database
  DATABASE_HOST: { category: "database", description: "Хост MySQL сервера", isSecret: false },
  DATABASE_PORT: { category: "database", description: "Порт MySQL сервера", isSecret: false },
  DATABASE_NAME: { category: "database", description: "Имя базы данных", isSecret: false },
  DATABASE_USER: { category: "database", description: "Пользователь БД", isSecret: false },
  DATABASE_PASSWORD: { category: "database", description: "Пароль БД", isSecret: true },
};

/**
 * Инициализирует таблицу настроек и загружает их в in-memory кэш
 */
export async function initSystemSettings(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const pool = getDbPool();

      // Гарантируем наличие таблицы
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          \`value\` TEXT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'general',
          description VARCHAR(255) NULL,
          is_secret BOOLEAN NOT NULL DEFAULT FALSE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_settings_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Загружаем все существующие настройки
      const [rows] = await pool.query<SettingRow[]>(
        "SELECT id, `value`, category, description, is_secret FROM system_settings"
      );

      // Если таблица пуста, сидируем текущими значениями из process.env
      if (rows.length === 0) {
        console.log("⚙️ [SystemSettings] Seeding initial settings from environment to database...");
        for (const [key, meta] of Object.entries(KEY_METADATA)) {
          const envVal = process.env[key] !== undefined ? String(process.env[key]) : null;
          await pool.query(
            `INSERT INTO system_settings (id, \`value\`, category, description, is_secret)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
            [key, envVal, meta.category, meta.description, meta.isSecret ? 1 : 0]
          );

          settingsCache.set(key, {
            id: key,
            value: envVal,
            category: meta.category,
            description: meta.description,
            isSecret: meta.isSecret,
          });
        }
      } else {
        // Наполняем кэш из БД
        for (const row of rows) {
          const item: SettingItem = {
            id: row.id,
            value: row.value,
            category: row.category,
            description: row.description,
            isSecret: Boolean(row.is_secret),
          };
          settingsCache.set(row.id, item);

          // Синхронизируем значение в process.env для обратной совместимости
          if (row.value !== null && row.value !== undefined) {
            process.env[row.id] = row.value;
          }
        }
      }

      isInitialized = true;
      console.log(`✅ [SystemSettings] Loaded ${settingsCache.size} settings from database into memory`);
    } catch (error: any) {
      console.error("❌ [SystemSettings] Failed to initialize settings from database:", error.message);
    }
  })();

  return initPromise;
}

/**
 * Синхронное получение настройки из кэша (с fallback на process.env)
 */
export function getSettingSync(key: string, defaultValue = ""): string {
  const cached = settingsCache.get(key);
  if (cached && cached.value !== null && cached.value !== undefined) {
    return cached.value;
  }
  return process.env[key] !== undefined ? String(process.env[key]) : defaultValue;
}

export const getSystemSetting = getSettingSync;

/**
 * Асинхронное получение настройки (гарантирует инициализацию кэша)
 */
export async function getSetting(key: string, defaultValue = ""): string {
  if (!isInitialized) {
    await initSystemSettings();
  }
  return getSettingSync(key, defaultValue);
}

/**
 * Сохранение группы настроек в базу данных
 */
export async function saveSettings(
  payload: Record<string, any>
): Promise<{ updatedCount: number }> {
  if (!isInitialized) {
    await initSystemSettings();
  }

  const pool = getDbPool();
  let updatedCount = 0;

  for (const [rawKey, rawValue] of Object.entries(payload)) {
    const key = rawKey.trim();
    if (!key || rawValue === undefined || rawValue === null) continue;

    const strValue = String(rawValue);
    const existing = settingsCache.get(key);
    const meta = KEY_METADATA[key] || {
      category: "general",
      description: null,
      isSecret: false,
    };

    // Если секрет передан как '••••••••' или пустая строка при существующем секрете, не перезаписываем его
    if (meta.isSecret && (strValue.includes("••") || strValue.trim() === "")) {
      continue;
    }

    // Сохраняем в MySQL
    await pool.query(
      `INSERT INTO system_settings (id, \`value\`, category, description, is_secret, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         \`value\` = VALUES(\`value\`),
         category = COALESCE(VALUES(category), category),
         updated_at = NOW()`,
      [key, strValue, meta.category, meta.description, meta.isSecret ? 1 : 0]
    );

    // Обновляем кэш
    settingsCache.set(key, {
      id: key,
      value: strValue,
      category: meta.category,
      description: meta.description,
      isSecret: meta.isSecret,
    });

    // Синхронизируем с process.env
    process.env[key] = strValue;
    updatedCount++;
  }

  console.log(`💾 [SystemSettings] Successfully updated ${updatedCount} settings in database`);
  return { updatedCount };
}

/**
 * Получение всех настроек в сгруппированном виде для фронтенда
 */
export async function getAllSettingsGrouped(maskSecrets = true): Promise<{
  database: Record<string, string>;
  application: Record<string, string>;
  jwt: Record<string, string>;
  telegram: Record<string, string>;
  openai: Record<string, string>;
  coursePlanner: Record<string, string>;
}> {
  if (!isInitialized) {
    await initSystemSettings();
  }

  const getValue = (key: string, defaultVal = ""): string => {
    const item = settingsCache.get(key);
    const val = item?.value ?? process.env[key] ?? defaultVal;
    if (maskSecrets && item?.isSecret && val) {
      return "••••••••";
    }
    return String(val);
  };

  return {
    database: {
      DATABASE_HOST: getValue("DATABASE_HOST", "localhost"),
      DATABASE_PORT: getValue("DATABASE_PORT", "3306"),
      DATABASE_NAME: getValue("DATABASE_NAME", "atc"),
      DATABASE_USER: getValue("DATABASE_USER", "root"),
      DATABASE_PASSWORD: getValue("DATABASE_PASSWORD", ""),
    },
    application: {
      APP_URL: getValue("APP_URL", ""),
      APP_NAME: getValue("APP_NAME", "ATC Platform"),
      APP_TIMEZONE: getValue("APP_TIMEZONE", "Asia/Almaty"),
      NODE_ENV: getValue("NODE_ENV", "production"),
      AUTO_MIGRATE: getValue("AUTO_MIGRATE", "true"),
    },
    jwt: {
      JWT_SECRET: getValue("JWT_SECRET", ""),
      JWT_EXPIRES_IN: getValue("JWT_EXPIRES_IN", "7d"),
      REFRESH_TOKEN_SECRET: getValue("REFRESH_TOKEN_SECRET", ""),
      REFRESH_TOKEN_EXPIRES_IN: getValue("REFRESH_TOKEN_EXPIRES_IN", "30d"),
    },
    telegram: {
      TELEGRAM_BOT_TOKEN: getValue("TELEGRAM_BOT_TOKEN", ""),
      TELEGRAM_WEBHOOK_SECRET: getValue("TELEGRAM_WEBHOOK_SECRET", ""),
    },
    openai: {
      OPENAI_API_KEY: getValue("OPENAI_API_KEY", ""),
      USE_OPENROUTER: getValue("USE_OPENROUTER", "true"),
      OPENAI_VISION_MODEL: getValue("OPENAI_VISION_MODEL", "openai/gpt-4o"),
      OPENAI_TEXT_MODEL: getValue("OPENAI_TEXT_MODEL", "openai/gpt-3.5-turbo"),
      OPENAI_MAX_TOKENS: getValue("OPENAI_MAX_TOKENS", "1500"),
      OPENAI_TEMPERATURE: getValue("OPENAI_TEMPERATURE", "0.1"),
    },
    coursePlanner: {
      COURSE_PLANNER_URL: getValue("COURSE_PLANNER_URL", "http://localhost:3000"),
      COURSE_PLANNER_API_TOKEN: getValue("COURSE_PLANNER_API_TOKEN", ""),
      COURSE_PLANNER_ENABLED: getValue("COURSE_PLANNER_ENABLED", "true"),
      PLANNER_API_TOKEN: getValue("PLANNER_API_TOKEN", ""),
    },
  };
}
