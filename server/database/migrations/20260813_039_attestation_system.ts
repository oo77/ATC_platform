import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Система аттестации инструкторов
 * Дата: 2026-08-13
 * Описание: Создаёт таблицы для аттестации инструкторов:
 *   - commission_members (реестр членов комиссии)
 *   - attestation_groups (группы аттестации)
 *   - attestation_group_instructors (инструкторы в группе)
 *   - attestation_group_commission (комиссия, назначенная на группу)
 *   - attestation_test_sessions (сессии прохождения теста инструктором)
 *   - attestation_test_answers (ответы инструктора)
 *   - attestation_results (итоговое решение комиссии по инструктору)
 *   Плюс расширяет ENUM files.category новой категорией attestation_document.
 */

export const description = "Attestation (instructor certification) system";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Attestation system");

  // 1. commission_members
  await connection.query(`
    CREATE TABLE IF NOT EXISTS commission_members (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      position VARCHAR(255) NULL,
      organization VARCHAR(255) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. attestation_groups
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attestation_groups (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      test_template_id VARCHAR(191) NULL,
      exam_start DATETIME(3) NULL,
      exam_end DATETIME(3) NULL,
      location VARCHAR(255) NULL,
      responsible_person VARCHAR(255) NULL COMMENT 'Ф.И.О. ответственного за проведение (для протокола)',
      status ENUM('draft', 'scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
      protocol_file_id INT UNSIGNED NULL,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

      INDEX idx_status (status),
      INDEX idx_test_template_id (test_template_id),
      INDEX idx_exam_start (exam_start),
      CONSTRAINT fk_attestation_groups_template FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE SET NULL,
      CONSTRAINT fk_attestation_groups_protocol_file FOREIGN KEY (protocol_file_id) REFERENCES files(id) ON DELETE SET NULL,
      CONSTRAINT fk_attestation_groups_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. attestation_group_instructors
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attestation_group_instructors (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      position_snapshot VARCHAR(255) NULL COMMENT 'Должность на момент включения в группу (для бланка)',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

      UNIQUE KEY uk_group_instructor (group_id, instructor_id),
      INDEX idx_instructor_id (instructor_id),
      CONSTRAINT fk_agi_group FOREIGN KEY (group_id) REFERENCES attestation_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_agi_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. attestation_group_commission
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attestation_group_commission (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      commission_member_id VARCHAR(191) NOT NULL,
      role ENUM('chairman', 'secretary', 'member') NOT NULL DEFAULT 'member',
      order_index INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

      UNIQUE KEY uk_group_commission_member (group_id, commission_member_id),
      INDEX idx_commission_member_id (commission_member_id),
      CONSTRAINT fk_agc_group FOREIGN KEY (group_id) REFERENCES attestation_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_agc_member FOREIGN KEY (commission_member_id) REFERENCES commission_members(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. attestation_test_sessions
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attestation_test_sessions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      attempt_number INT NOT NULL DEFAULT 1,
      status ENUM('in_progress', 'completed', 'timeout', 'cancelled', 'violation') NOT NULL DEFAULT 'in_progress',
      questions_order JSON NULL,
      current_question_index INT NOT NULL DEFAULT 0,
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at DATETIME(3) NULL,
      time_spent_seconds INT NULL,
      total_points INT NULL,
      max_points INT NULL,
      score_percent DECIMAL(5, 2) NULL,
      passed BOOLEAN NULL,
      grade INT NULL,
      violations JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

      UNIQUE KEY uk_group_instructor_attempt (group_id, instructor_id, attempt_number),
      INDEX idx_instructor_id (instructor_id),
      CONSTRAINT fk_ats_group FOREIGN KEY (group_id) REFERENCES attestation_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_ats_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 6. attestation_test_answers
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attestation_test_answers (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      session_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      answer_data JSON NOT NULL,
      is_correct BOOLEAN NULL,
      points_earned INT NOT NULL DEFAULT 0,
      answered_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      time_spent_seconds INT NULL,

      UNIQUE KEY uk_session_question (session_id, question_id),
      CONSTRAINT fk_ata_session FOREIGN KEY (session_id) REFERENCES attestation_test_sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_ata_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 7. attestation_results
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attestation_results (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      score_percent DECIMAL(5, 2) NULL,
      decision ENUM('passed', 'failed', 'pending') NOT NULL DEFAULT 'pending',
      decided_at DATETIME(3) NULL,
      decided_by VARCHAR(191) NULL,
      notes TEXT NULL,
      evaluation_sheet_file_id INT UNSIGNED NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

      UNIQUE KEY uk_group_instructor (group_id, instructor_id),
      INDEX idx_instructor_id (instructor_id),
      INDEX idx_decision (decision),
      CONSTRAINT fk_ar_group FOREIGN KEY (group_id) REFERENCES attestation_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_ar_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
      CONSTRAINT fk_ar_decided_by FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_ar_evaluation_sheet_file FOREIGN KEY (evaluation_sheet_file_id) REFERENCES files(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 8. files.category — добавляем категорию для документов аттестации
  await connection.query(`
    ALTER TABLE files
    MODIFY COLUMN category ENUM(
      'profile',
      'certificate_template',
      'certificate_generated',
      'course_material',
      'course_media',
      'course_cover',
      'group_gallery',
      'group_file',
      'group_report',
      'assignment',
      'instructor_diploma',
      'instructor_certificate',
      'instructor_photo',
      'instructor_additional',
      'attestation_document',
      'other'
    ) NOT NULL
  `);

  console.log("✅ Attestation system tables created");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: Attestation system");

  const tables = [
    "attestation_results",
    "attestation_test_answers",
    "attestation_test_sessions",
    "attestation_group_commission",
    "attestation_group_instructors",
    "attestation_groups",
    "commission_members",
  ];
  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
  }

  await connection.query(`
    ALTER TABLE files
    MODIFY COLUMN category ENUM(
      'profile',
      'certificate_template',
      'certificate_generated',
      'course_material',
      'course_media',
      'course_cover',
      'group_gallery',
      'group_file',
      'group_report',
      'assignment',
      'instructor_diploma',
      'instructor_certificate',
      'instructor_photo',
      'instructor_additional',
      'other'
    ) NOT NULL
  `);

  console.log("✅ Rollback completed successfully");
};
