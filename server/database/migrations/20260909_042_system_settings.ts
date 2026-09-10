import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Таблица системных настроек платформы (system_settings)
 * Дата: 2026-09-09
 * Описание: Перенос хранения настроек, токенов и конфигураций из .env в базу данных.
 */

export const description = "Create system_settings table for database-backed configuration";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260909_042_system_settings");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR(64) NOT NULL PRIMARY KEY COMMENT 'Ключ настройки, напр. COURSE_PLANNER_URL',
      \`value\` TEXT NULL COMMENT 'Значение настройки',
      category VARCHAR(50) NOT NULL DEFAULT 'general' COMMENT 'Категория настройки',
      description VARCHAR(255) NULL COMMENT 'Человекопонятное описание',
      is_secret BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Флаг секретности (маскирование паролей/токенов)',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_settings_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Системные настройки платформы';
  `);

  // Начальное заполнение базовыми значениями (INSERT IGNORE)
  const defaultSettings = [
    // Course Planner 2
    ['COURSE_PLANNER_URL', process.env.COURSE_PLANNER_URL || 'http://localhost:3000', 'course_planner', 'URL сервера Course Planner 2', 0],
    ['COURSE_PLANNER_API_TOKEN', process.env.COURSE_PLANNER_API_TOKEN || '4f153ce803277d908b67ec71f7d4aaec6cb4612a7a0c36edd96350667cef6915', 'course_planner', 'API токен для обращения к Course Planner 2', 1],
    ['COURSE_PLANNER_ENABLED', process.env.COURSE_PLANNER_ENABLED || 'true', 'course_planner', 'Флаг активности интеграции с Course Planner 2', 0],
    ['PLANNER_API_TOKEN', process.env.PLANNER_API_TOKEN || 'a901a38eb68f577c7e15662324b92ef00dab47f3cb1b02507971b9cf37924084', 'course_planner', 'Токен входящих запросов от Course Planner 2', 1],

    // Application
    ['APP_NAME', process.env.APP_NAME || 'ATC Platform', 'application', 'Название платформы', 0],
    ['APP_URL', process.env.APP_URL || 'https://charlena-nonarbitrable-eddy.ngrok-free.dev', 'application', 'Публичный URL приложения', 0],
    ['APP_TIMEZONE', process.env.APP_TIMEZONE || 'Asia/Almaty', 'application', 'Часовой пояс приложения', 0],
    ['NODE_ENV', process.env.NODE_ENV || 'production', 'application', 'Режим окружения', 0],
    ['AUTO_MIGRATE', process.env.AUTO_MIGRATE || 'true', 'application', 'Автоматическое применение миграций', 0],

    // Telegram
    ['TELEGRAM_BOT_TOKEN', process.env.TELEGRAM_BOT_TOKEN || '', 'telegram', 'Токен Telegram бота', 1],
    ['TELEGRAM_WEBHOOK_SECRET', process.env.TELEGRAM_WEBHOOK_SECRET || '', 'telegram', 'Секрет Telegram вебхука', 1],

    // Security / JWT
    ['JWT_SECRET', process.env.JWT_SECRET || 'atc_secret', 'security', 'Секретный ключ JWT', 1],
    ['JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN || '7d', 'security', 'Срок действия JWT', 0],
    ['REFRESH_TOKEN_SECRET', process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-token-key-change-this-in-production-67890', 'security', 'Секретный ключ Refresh токена', 1],
    ['REFRESH_TOKEN_EXPIRES_IN', process.env.REFRESH_TOKEN_EXPIRES_IN || '30d', 'security', 'Срок действия Refresh токена', 0],

    // Database (для отображения в настройках)
    ['DATABASE_HOST', process.env.DATABASE_HOST || 'localhost', 'database', 'Хост MySQL сервера', 0],
    ['DATABASE_PORT', process.env.DATABASE_PORT || '3306', 'database', 'Порт MySQL сервера', 0],
    ['DATABASE_NAME', process.env.DATABASE_NAME || 'atc', 'database', 'Имя базы данных', 0],
    ['DATABASE_USER', process.env.DATABASE_USER || 'root', 'database', 'Пользователь БД', 0],
  ];

  for (const row of defaultSettings) {
    await connection.query(
      `INSERT IGNORE INTO system_settings (id, \`value\`, category, description, is_secret) VALUES (?, ?, ?, ?, ?)`,
      row
    );
  }

  console.log("✅ Migration 20260909_042_system_settings completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260909_042_system_settings");
  await connection.query(`DROP TABLE IF EXISTS system_settings`);
  console.log("✅ Rollback completed successfully");
};
