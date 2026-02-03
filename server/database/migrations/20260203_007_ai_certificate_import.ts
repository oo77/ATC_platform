import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: AI Certificate Import System
 * Дата: 2026-02-03
 * Описание: Добавление полей для AI-импорта сертификатов и таблицы логов обработки
 *
 * Изменения:
 * 1. Расширение таблицы issued_certificates новыми полями для AI-данных
 * 2. Создание таблицы ai_certificate_processing_logs для аудита
 */

export const description = "AI Certificate Import System";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: AI Certificate Import System");

  // ============================================================
  // 1. Проверка существования таблицы issued_certificates
  // ============================================================
  const [tables] = await connection.query<any[]>(
    "SHOW TABLES LIKE 'issued_certificates'",
  );

  if (!tables || tables.length === 0) {
    throw new Error(
      "❌ Таблица issued_certificates не существует! Запустите базовую миграцию сначала.",
    );
  }

  // ============================================================
  // 2. Добавление полей в таблицу issued_certificates
  // ============================================================
  console.log(
    "📝 Добавление полей для AI-импорта в таблицу issued_certificates...",
  );

  // Проверяем существование каждого поля перед добавлением
  const [columns] = await connection.query<any[]>(
    "SHOW COLUMNS FROM issued_certificates LIKE 'ai_extracted_data'",
  );

  if (!columns || columns.length === 0) {
    await connection.query(`
      ALTER TABLE issued_certificates
        -- AI-данные
        ADD COLUMN ai_extracted_data JSON NULL COMMENT 'Данные, извлечённые AI из сертификата',
        ADD COLUMN ai_confidence DECIMAL(3,2) NULL COMMENT 'Уровень уверенности AI (0.00-1.00)',
        ADD COLUMN ai_processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT NULL COMMENT 'Статус AI-обработки',
        ADD COLUMN ai_processing_error TEXT NULL COMMENT 'Ошибка при AI-обработке',
        
        -- Метаданные импорта
        ADD COLUMN import_source ENUM('manual', 'ai_scan', 'excel', 'group_journal') DEFAULT 'group_journal' COMMENT 'Источник создания сертификата',
        ADD COLUMN original_file_url VARCHAR(500) NULL COMMENT 'URL оригинального отсканированного файла',
        
        -- Дополнительные поля из AI-Certificate
        ADD COLUMN course_hours_ai INT NULL COMMENT 'Количество часов курса (из AI)',
        ADD COLUMN issuing_organization VARCHAR(300) NULL COMMENT 'Организация, выдавшая сертификат',
        
        -- Индексы
        ADD INDEX idx_import_source (import_source),
        ADD INDEX idx_ai_processing_status (ai_processing_status),
        ADD INDEX idx_ai_confidence (ai_confidence)
    `);
    console.log("✅ Поля AI-импорта добавлены в issued_certificates");
  } else {
    console.log(
      "⚠️  Поля AI-импорта уже существуют в issued_certificates, пропускаем",
    );
  }

  // ============================================================
  // 3. Создание таблицы ai_certificate_processing_logs
  // ============================================================
  console.log("📝 Создание таблицы ai_certificate_processing_logs...");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_certificate_processing_logs (
      id VARCHAR(191) PRIMARY KEY,
      certificate_id VARCHAR(191) NULL COMMENT 'ID созданного сертификата (если успешно)',
      original_filename VARCHAR(255) NOT NULL,
      file_size_bytes INT NOT NULL,
      processing_started_at DATETIME(3) NOT NULL,
      processing_completed_at DATETIME(3) NULL,
      processing_duration_ms INT NULL,
      
      -- AI-данные
      ai_model VARCHAR(50) NOT NULL COMMENT 'Модель AI (gpt-4o, gpt-3.5-turbo)',
      ai_tokens_used INT NULL,
      ai_cost_usd DECIMAL(10,6) NULL,
      ai_confidence DECIMAL(3,2) NULL,
      
      -- Результат
      status ENUM('success', 'failed', 'partial') NOT NULL,
      extracted_data JSON NULL,
      error_message TEXT NULL,
      
      -- Сопоставление со слушателем
      matched_student_id VARCHAR(191) NULL,
      match_method ENUM('exact_pinfl', 'exact_name', 'fuzzy_ai', 'manual') NULL,
      match_confidence DECIMAL(3,2) NULL,
      
      -- Аудит
      processed_by VARCHAR(191) NOT NULL COMMENT 'ID администратора',
      ip_address VARCHAR(45) NULL,
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_certificate_id (certificate_id),
      INDEX idx_status (status),
      INDEX idx_processed_by (processed_by),
      INDEX idx_created_at (created_at),
      INDEX idx_match_method (match_method),
      
      CONSTRAINT fk_ai_logs_certificate
        FOREIGN KEY (certificate_id) REFERENCES issued_certificates(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ai_logs_student
        FOREIGN KEY (matched_student_id) REFERENCES students(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ai_logs_user
        FOREIGN KEY (processed_by) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Таблица ai_certificate_processing_logs создана");

  console.log("✅ Migration completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: AI Certificate Import System");

  // ============================================================
  // 1. Удаление таблицы логов
  // ============================================================
  console.log("📝 Удаление таблицы ai_certificate_processing_logs...");
  await connection.query(`DROP TABLE IF EXISTS ai_certificate_processing_logs`);
  console.log("✅ Таблица ai_certificate_processing_logs удалена");

  // ============================================================
  // 2. Удаление полей из issued_certificates
  // ============================================================
  console.log("📝 Удаление полей AI-импорта из issued_certificates...");

  // Проверяем существование полей перед удалением
  const [columns] = await connection.query<any[]>(
    "SHOW COLUMNS FROM issued_certificates LIKE 'ai_extracted_data'",
  );

  if (columns && columns.length > 0) {
    // Сначала удаляем индексы
    await connection.query(`
      ALTER TABLE issued_certificates
        DROP INDEX IF EXISTS idx_import_source,
        DROP INDEX IF EXISTS idx_ai_processing_status,
        DROP INDEX IF EXISTS idx_ai_confidence
    `);

    // Затем удаляем столбцы
    await connection.query(`
      ALTER TABLE issued_certificates
        DROP COLUMN IF EXISTS ai_extracted_data,
        DROP COLUMN IF EXISTS ai_confidence,
        DROP COLUMN IF EXISTS ai_processing_status,
        DROP COLUMN IF EXISTS ai_processing_error,
        DROP COLUMN IF EXISTS import_source,
        DROP COLUMN IF EXISTS original_file_url,
        DROP COLUMN IF EXISTS course_hours_ai,
        DROP COLUMN IF EXISTS issuing_organization
    `);
    console.log("✅ Поля AI-импорта удалены из issued_certificates");
  } else {
    console.log("⚠️  Поля AI-импорта не найдены в issued_certificates");
  }

  console.log("✅ Rollback completed successfully");
};
