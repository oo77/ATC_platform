import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Журнал запросов представителей в Telegram-боте
 * Дата: 2025-12-29
 * Описание: 
 * - Создаёт таблицу telegram_bot_requests для логирования всех запросов представителей
 * - Хранит информацию о команде, времени, статусе выполнения
 */

export const description = 'Журнал запросов представителей в Telegram-боте';

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: telegram_bot_requests');

  // ============================================================
  // Создаём таблицу логов запросов
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_requests (
      id VARCHAR(191) PRIMARY KEY,
      representative_id VARCHAR(191) NOT NULL COMMENT 'ID представителя',
      chat_id BIGINT NOT NULL COMMENT 'Telegram Chat ID',
      command VARCHAR(100) NOT NULL COMMENT 'Команда или действие',
      request_type ENUM('command', 'callback', 'message') NOT NULL DEFAULT 'command' COMMENT 'Тип запроса',
      request_data JSON COMMENT 'Дополнительные данные запроса',
      status ENUM('success', 'error', 'denied') NOT NULL DEFAULT 'success' COMMENT 'Статус выполнения',
      error_message TEXT COMMENT 'Сообщение об ошибке',
      response_time_ms INT COMMENT 'Время ответа в миллисекундах',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_representative_id (representative_id),
      INDEX idx_chat_id (chat_id),
      INDEX idx_command (command),
      INDEX idx_request_type (request_type),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_rep_created (representative_id, created_at DESC),
      
      CONSTRAINT fk_bot_requests_representative 
        FOREIGN KEY (representative_id) REFERENCES organization_representatives(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "telegram_bot_requests" created');

  // ============================================================
  // Добавляем entity_type для логирования
  // ============================================================
  try {
    await connection.query(`
      ALTER TABLE activity_logs 
      MODIFY COLUMN entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE',
        'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE', 'CERTIFICATE_DATABASE',
        'TELEGRAM_BOT_REQUEST'
      ) NOT NULL
    `);
    console.log('✅ Added TELEGRAM_BOT_REQUEST entity type to activity_logs');
  } catch (error) {
    console.log('ℹ️  entity_type already has the required values or modification skipped');
  }

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: telegram_bot_requests');

  // Удаляем таблицу
  await connection.query(`DROP TABLE IF EXISTS telegram_bot_requests`);

  console.log('✅ Rollback completed successfully');
};
