import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Расширение шаблонов сертификатов и выданные сертификаты
 * Дата: 2025-12-26
 * Описание: 
 * - Расширяет таблицу certificate_templates для хранения переменных и QR-настроек
 * - Создаёт таблицу issued_certificates для выданных сертификатов
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: certificate_templates_extended');

  // Расширяем таблицу certificate_templates
  await connection.query(`
    ALTER TABLE certificate_templates 
    ADD COLUMN IF NOT EXISTS original_file_url VARCHAR(500) COMMENT 'Путь к оригинальному DOCX файлу',
    ADD COLUMN IF NOT EXISTS variables JSON COMMENT 'Маппинг переменных шаблона',
    ADD COLUMN IF NOT EXISTS qr_settings JSON COMMENT 'Настройки QR-кода (позиция, размер)',
    ADD COLUMN IF NOT EXISTS number_format VARCHAR(100) DEFAULT 'ATC{YY}_{CODE}_{NUM}' COMMENT 'Формат номера сертификата',
    ADD COLUMN IF NOT EXISTS last_number INT DEFAULT 0 COMMENT 'Последний использованный номер для инкремента'
  `);

  // Создаём таблицу выданных сертификатов
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      template_id VARCHAR(191) NOT NULL,
      certificate_number VARCHAR(100) NOT NULL UNIQUE,
      issue_date DATE NOT NULL,
      
      -- Файлы
      docx_file_url VARCHAR(500) COMMENT 'Путь к сгенерированному DOCX',
      pdf_file_url VARCHAR(500) COMMENT 'Путь к сгенерированному PDF',
      
      -- Статус и данные
      status ENUM('draft', 'issued', 'revoked') DEFAULT 'draft',
      variables_data JSON COMMENT 'Данные, подставленные в шаблон',
      
      -- Предупреждения при выдаче
      warnings JSON COMMENT 'Предупреждения при выдаче (низкая посещаемость и т.д.)',
      override_warnings BOOLEAN DEFAULT FALSE COMMENT 'Были ли проигнорированы предупреждения',
      
      -- Аудит
      issued_by VARCHAR(191) COMMENT 'ID пользователя, выдавшего сертификат',
      issued_at DATETIME(3) COMMENT 'Дата и время выдачи',
      revoked_by VARCHAR(191) COMMENT 'ID пользователя, отозвавшего сертификат',
      revoked_at DATETIME(3) COMMENT 'Дата и время отзыва',
      revoke_reason TEXT COMMENT 'Причина отзыва',
      
      notes TEXT COMMENT 'Примечания',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- Индексы
      INDEX idx_group_id (group_id),
      INDEX idx_student_id (student_id),
      INDEX idx_template_id (template_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_status (status),
      INDEX idx_issue_date (issue_date),
      UNIQUE INDEX idx_student_group (student_id, group_id),
      
      -- Внешние ключи
      CONSTRAINT fk_issued_cert_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_template 
        FOREIGN KEY (template_id) REFERENCES certificate_templates(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_issued_by 
        FOREIGN KEY (issued_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_revoked_by 
        FOREIGN KEY (revoked_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Добавляем entity_type ISSUED_CERTIFICATE для логирования
  await connection.query(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM(
      'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
      'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
      'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE',
      'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE'
    ) NOT NULL
  `);

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: certificate_templates_extended');

  // Удаляем таблицу выданных сертификатов
  await connection.query(`DROP TABLE IF EXISTS issued_certificates`);

  // Откатываем изменения в certificate_templates
  await connection.query(`
    ALTER TABLE certificate_templates 
    DROP COLUMN IF EXISTS original_file_url,
    DROP COLUMN IF EXISTS variables,
    DROP COLUMN IF EXISTS qr_settings,
    DROP COLUMN IF EXISTS number_format,
    DROP COLUMN IF EXISTS last_number
  `);

  console.log('✅ Rollback completed successfully');
};

export const description = 'Расширение шаблонов сертификатов и таблица выданных сертификатов';
