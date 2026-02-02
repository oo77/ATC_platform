import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Testing System Module
 * Date: 2026-01-04
 * Description: Creates tables for the testing system:
 *   - question_banks
 *   - questions
 *   - test_templates
 *   - test_template_questions
 *   - discipline_tests
 *   - test_assignments
 *   - test_sessions
 *   - test_answers
 */

export const description = "Testing System Module";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Testing System Module");

  // 1. question_banks
  await connection.query(`
    CREATE TABLE IF NOT EXISTS question_banks (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_category (category),
      FULLTEXT INDEX ft_search (name, description, category),
      CONSTRAINT fk_question_banks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. questions
  await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      bank_id VARCHAR(191) NOT NULL,
      question_type ENUM('single', 'multiple', 'text', 'order', 'match') NOT NULL DEFAULT 'single',
      question_text TEXT NOT NULL,
      question_media JSON NULL,
      options JSON NOT NULL,
      points INT NOT NULL DEFAULT 1,
      explanation TEXT NULL,
      difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
      tags JSON NULL,
      order_index INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_bank_id (bank_id),
      FULLTEXT INDEX ft_question_text (question_text),
      CONSTRAINT fk_questions_bank FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. test_templates
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_templates (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      bank_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NULL,
      questions_mode ENUM('all', 'random', 'manual') NOT NULL DEFAULT 'all',
      questions_count INT NULL,
      time_limit_minutes INT NULL,
      passing_score INT NOT NULL DEFAULT 60,
      max_attempts INT NOT NULL DEFAULT 1,
      shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
      shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,
      questions_per_page INT NOT NULL DEFAULT 1,
      show_results ENUM('immediately', 'after_deadline', 'manual', 'never') NOT NULL DEFAULT 'immediately',
      allow_back BOOLEAN NOT NULL DEFAULT TRUE,
      proctoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      proctoring_settings JSON NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_bank_id (bank_id),
      CONSTRAINT fk_test_templates_bank FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. test_template_questions
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_template_questions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      template_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      points_override INT NULL,
      
      UNIQUE KEY uk_template_question (template_id, question_id),
      CONSTRAINT fk_ttq_template FOREIGN KEY (template_id) REFERENCES test_templates(id) ON DELETE CASCADE,
      CONSTRAINT fk_ttq_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. discipline_tests
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_tests (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT FALSE,
      order_index INT NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      UNIQUE KEY uk_discipline_test (discipline_id, test_template_id),
      CONSTRAINT fk_discipline_tests_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
      CONSTRAINT fk_discipline_tests_template FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 6. test_assignments
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_assignments (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      group_id VARCHAR(191) NOT NULL,
      
      allowed_student_ids JSON NULL COMMENT 'List of allowed student IDs (e.g. for retakes)',
      
      time_limit_override INT NULL,
      passing_score_override INT NULL,
      start_date DATETIME(3) NULL,
      end_date DATETIME(3) NULL,
      status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
      assigned_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE KEY uk_schedule_event (schedule_event_id),
      CONSTRAINT fk_test_assignments_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_template FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE RESTRICT,
      CONSTRAINT fk_test_assignments_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 7. test_sessions
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      assignment_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
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
      
      UNIQUE KEY uk_assignment_student_attempt (assignment_id, student_id, attempt_number),
      CONSTRAINT fk_test_sessions_assignment FOREIGN KEY (assignment_id) REFERENCES test_assignments(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 8. test_answers
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_answers (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      session_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      answer_data JSON NOT NULL,
      is_correct BOOLEAN NULL,
      points_earned INT NOT NULL DEFAULT 0,
      answered_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      time_spent_seconds INT NULL,
      
      UNIQUE KEY uk_session_question (session_id, question_id),
      CONSTRAINT fk_test_answers_session FOREIGN KEY (session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("✅ Testing System tables created");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Testing System Module");
  const tables = [
    "test_answers",
    "test_sessions",
    "test_assignments",
    "discipline_tests",
    "test_template_questions",
    "test_templates",
    "questions",
    "question_banks",
  ];
  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
  }
  console.log("✅ Tables dropped");
};
