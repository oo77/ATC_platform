import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 020: Face Recognition System
 * Date: 2026-02-16
 * Description: Создает таблицы для системы распознавания лиц и контроля посещаемости.
 *              Добавляет хранилище для face embeddings и логов распознавания.
 */

export const description = "Face Recognition System";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Face Recognition System");

  // ============================================================
  // 1. STUDENT_FACE_EMBEDDINGS - Биометрические данные студентов
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS student_face_embeddings (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      
      -- Векторное представление лица (512 float32 = 2048 bytes)
      embedding BLOB NOT NULL COMMENT 'Face embedding vector (512 dimensions)',
      
      -- Метаданные модели
      embedding_model VARCHAR(50) NOT NULL DEFAULT 'face_recognition' COMMENT 'Model name: face_recognition, facenet, arcface',
      embedding_version VARCHAR(20) DEFAULT '1.0' COMMENT 'Model version for compatibility',
      
      -- Качество регистрации
      quality_score FLOAT DEFAULT NULL COMMENT 'Image quality score (0-1)',
      face_size_pixels INT DEFAULT NULL COMMENT 'Face size in original image',
      brightness_level FLOAT DEFAULT NULL COMMENT 'Lighting conditions',
      
      -- Управление активностью
      is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active embedding for recognition',
      
      -- Дополнительная информация
      captured_at DATETIME(3) NOT NULL COMMENT 'When the face was registered',
      registered_by VARCHAR(191) NULL COMMENT 'User who registered this face',
      notes TEXT NULL COMMENT 'Additional notes',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_active (is_active),
      INDEX idx_student_active (student_id, is_active),
      INDEX idx_model (embedding_model),
      INDEX idx_captured_at (captured_at),
      
      CONSTRAINT fk_face_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_face_registered_by 
        FOREIGN KEY (registered_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "student_face_embeddings" created');

  // ============================================================
  // 2. FACE_RECOGNITION_LOGS - Логи распознавания
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS face_recognition_logs (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Связи
      student_id VARCHAR(191) NULL COMMENT 'NULL if face not recognized',
      schedule_event_id VARCHAR(191) NULL COMMENT 'Related schedule event',
      
      -- Результаты распознавания
      recognition_confidence FLOAT NULL COMMENT 'Confidence score (0-1)',
      distance FLOAT NULL COMMENT 'Face distance metric',
      status ENUM('success', 'failed', 'unknown_face', 'multiple_faces', 'no_face') NOT NULL,
      
      -- Информация о кадре
      captured_image_path VARCHAR(500) NULL COMMENT 'Path to saved frame',
      image_width INT NULL,
      image_height INT NULL,
      face_location JSON NULL COMMENT 'Face bounding box coordinates',
      
      -- Дополнительная диагностика
      processing_time_ms INT NULL COMMENT 'Recognition processing time',
      total_embeddings_compared INT NULL COMMENT 'Number of embeddings compared',
      error_message TEXT NULL COMMENT 'Error details if failed',
      
      recognized_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_student (student_id),
      INDEX idx_event (schedule_event_id),
      INDEX idx_status (status),
      INDEX idx_recognized_at (recognized_at),
      INDEX idx_event_date (schedule_event_id, recognized_at),
      
      CONSTRAINT fk_fr_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_fr_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "face_recognition_logs" created');

  // ============================================================
  // 3. FACE_RECOGNITION_SETTINGS - Настройки системы
  // ============================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS face_recognition_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value VARCHAR(500) NOT NULL,
      description TEXT,
      updated_by VARCHAR(191) NULL,
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_frs_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ Table "face_recognition_settings" created');

  // ============================================================
  // 4. Начальные настройки системы
  // ============================================================
  await connection.query(`
    INSERT INTO face_recognition_settings (setting_key, setting_value, description) VALUES
    ('RECOGNITION_THRESHOLD', '0.6', 'Minimum confidence for face recognition (0-1)'),
    ('MAX_FACE_DISTANCE', '0.4', 'Maximum distance for face_recognition library'),
    ('MIN_QUALITY_SCORE', '0.5', 'Minimum quality score for registration'),
    ('AUTO_MARK_ATTENDANCE', 'true', 'Automatically mark attendance on recognition'),
    ('SAVE_RECOGNITION_IMAGES', 'true', 'Save captured frames for audit'),
    ('IMAGE_RETENTION_DAYS', '7', 'Days to keep recognition images'),
    ('LOG_RETENTION_DAYS', '30', 'Days to keep recognition logs'),
    ('ALLOW_MULTIPLE_EMBEDDINGS', 'false', 'Allow multiple active embeddings per student'),
    ('REQUIRE_MANUAL_APPROVAL', 'false', 'Require manual approval for new registrations')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
  `);
  console.log("✅ Default settings inserted");

  console.log("✅ Face Recognition System migration completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Face Recognition System migration");

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  await connection.query("DROP TABLE IF EXISTS face_recognition_logs");
  console.log('🗑️  Dropped table "face_recognition_logs"');

  await connection.query("DROP TABLE IF EXISTS student_face_embeddings");
  console.log('🗑️  Dropped table "student_face_embeddings"');

  await connection.query("DROP TABLE IF EXISTS face_recognition_settings");
  console.log('🗑️  Dropped table "face_recognition_settings"');

  await connection.query("SET FOREIGN_KEY_CHECKS = 1");

  console.log("✅ Face Recognition System migration rolled back");
};
