import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Система сессий и сообщений ИИ-Чата
 * Дата: 2026-09-22
 */

export const description =
  "Создание таблиц ai_chat_sessions и ai_chat_messages для аналитического ИИ-чата";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260922_045_ai_chat_system");

  // Таблица сессий чата
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_chat_sessions (
      id VARCHAR(191) PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'Новый диалог',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_ai_chat_sessions_user_id (user_id),
      INDEX idx_ai_chat_sessions_updated_at (updated_at),
      
      CONSTRAINT fk_ai_chat_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Таблица сообщений чата
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_chat_messages (
      id VARCHAR(191) PRIMARY KEY,
      session_id VARCHAR(191) NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      content TEXT NOT NULL,
      steps JSON NULL COMMENT 'Шаги рассуждения ReAct агента',
      artifact JSON NULL COMMENT 'Структурированный артефакт (таблица, KPI, графики)',
      sql_executed TEXT NULL COMMENT 'Выполненный безопасный SQL запрос',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_ai_chat_messages_session_id (session_id),
      INDEX idx_ai_chat_messages_created_at (created_at),
      
      CONSTRAINT fk_ai_chat_messages_session
        FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("✅ Migration 20260922_045_ai_chat_system completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260922_045_ai_chat_system");

  await connection.query("DROP TABLE IF EXISTS ai_chat_messages;");
  await connection.query("DROP TABLE IF EXISTS ai_chat_sessions;");

  console.log("✅ Rollback completed successfully");
};
