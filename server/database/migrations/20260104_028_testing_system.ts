import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Система тестирования студентов
 * Дата: 2026-01-04
 * Описание: Создание 8 таблиц для системы онлайн/офлайн тестирования:
 *   - question_banks (банки вопросов)
 *   - questions (вопросы)
 *   - test_templates (шаблоны тестов)
 *   - test_template_questions (вопросы шаблона для manual режима)
 *   - discipline_tests (привязка тестов к дисциплинам)
 *   - test_assignments (назначение теста на занятие)
 *   - test_sessions (сессии прохождения)
 *   - test_answers (ответы студентов)
 */

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 20260104_028_testing_system');

    // ============================================================================
    // 1. question_banks — Банки вопросов (глобальные, независимые от курсов)
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS question_banks (
      id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_code (code),
      INDEX idx_category (category),
      INDEX idx_is_active (is_active),
      INDEX idx_created_by (created_by),
      FULLTEXT INDEX ft_search (name, description, category),
      
      CONSTRAINT fk_question_banks_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: question_banks');

    // ============================================================================
    // 2. questions — Вопросы для тестов
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(191) NOT NULL,
      bank_id VARCHAR(191) NOT NULL,
      question_type ENUM('single', 'multiple', 'text', 'order', 'match') NOT NULL DEFAULT 'single',
      question_text TEXT NOT NULL,
      question_media JSON NULL COMMENT 'Медиа: [{type, url, caption}]',
      options JSON NOT NULL COMMENT 'Варианты ответов в формате JSON',
      points INT NOT NULL DEFAULT 1,
      explanation TEXT NULL COMMENT 'Объяснение правильного ответа',
      difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
      tags JSON NULL COMMENT '["тег1", "тег2"]',
      order_index INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      INDEX idx_bank_id (bank_id),
      INDEX idx_question_type (question_type),
      INDEX idx_difficulty (difficulty),
      INDEX idx_is_active (is_active),
      INDEX idx_order (order_index),
      FULLTEXT INDEX ft_question_text (question_text),
      
      CONSTRAINT fk_questions_bank 
        FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: questions');

    // ============================================================================
    // 3. test_templates — Шаблоны тестов (глобальные, переиспользуемые)
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS test_templates (
      id VARCHAR(191) NOT NULL,
      bank_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      description TEXT NULL,
      questions_mode ENUM('all', 'random', 'manual') NOT NULL DEFAULT 'all' COMMENT 'all=все вопросы, random=случайные N, manual=вручную выбранные',
      questions_count INT NULL COMMENT 'Кол-во вопросов для режима random',
      time_limit_minutes INT NULL COMMENT 'Лимит времени в минутах (NULL = без лимита)',
      passing_score INT NOT NULL DEFAULT 60 COMMENT 'Проходной балл в процентах',
      max_attempts INT NOT NULL DEFAULT 1 COMMENT 'Макс. количество попыток',
      shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Перемешивать вопросы',
      shuffle_options BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Перемешивать варианты ответов',
      questions_per_page INT NOT NULL DEFAULT 1 COMMENT 'Вопросов на странице (1 = по одному)',
      show_results ENUM('immediately', 'after_deadline', 'manual', 'never') NOT NULL DEFAULT 'immediately',
      allow_back BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Разрешить возврат к вопросам',
      proctoring_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Включён ли антипрокторинг',
      proctoring_settings JSON NULL COMMENT '{blockTabSwitch: true, ...}',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_code (code),
      INDEX idx_bank_id (bank_id),
      INDEX idx_is_active (is_active),
      INDEX idx_created_by (created_by),
      
      CONSTRAINT fk_test_templates_bank 
        FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: test_templates');

    // ============================================================================
    // 4. test_template_questions — Вопросы шаблона (только для режима manual)
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS test_template_questions (
      id VARCHAR(191) NOT NULL,
      template_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      points_override INT NULL COMMENT 'Переопределённые баллы (NULL = из вопроса)',
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_template_question (template_id, question_id),
      INDEX idx_template_id (template_id),
      INDEX idx_question_id (question_id),
      INDEX idx_order (order_index),
      
      CONSTRAINT fk_ttq_template 
        FOREIGN KEY (template_id) REFERENCES test_templates(id) ON DELETE CASCADE,
      CONSTRAINT fk_ttq_question 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: test_template_questions');

    // ============================================================================
    // 5. discipline_tests — Связь дисциплин и шаблонов тестов
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_tests (
      id VARCHAR(191) NOT NULL,
      discipline_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Обязательный ли тест',
      order_index INT NOT NULL DEFAULT 0,
      notes TEXT NULL COMMENT 'Примечания',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_discipline_test (discipline_id, test_template_id),
      INDEX idx_discipline_id (discipline_id),
      INDEX idx_test_template_id (test_template_id),
      INDEX idx_order (order_index),
      
      CONSTRAINT fk_discipline_tests_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
      CONSTRAINT fk_discipline_tests_template 
        FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: discipline_tests');

    // ============================================================================
    // 6. test_assignments — Назначение теста на конкретное занятие
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS test_assignments (
      id VARCHAR(191) NOT NULL,
      schedule_event_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      group_id VARCHAR(191) NOT NULL,
      time_limit_override INT NULL COMMENT 'Переопределить лимит времени',
      passing_score_override INT NULL COMMENT 'Переопределить проходной балл',
      start_date DATETIME(3) NULL COMMENT 'Когда открывается тест',
      end_date DATETIME(3) NULL COMMENT 'Крайний срок',
      status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
      assigned_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_schedule_event (schedule_event_id),
      INDEX idx_test_template_id (test_template_id),
      INDEX idx_group_id (group_id),
      INDEX idx_status (status),
      INDEX idx_start_date (start_date),
      INDEX idx_end_date (end_date),
      INDEX idx_assigned_by (assigned_by),
      
      CONSTRAINT fk_test_assignments_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_template 
        FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE RESTRICT,
      CONSTRAINT fk_test_assignments_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: test_assignments');

    // ============================================================================
    // 7. test_sessions — Сессии прохождения теста студентом
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id VARCHAR(191) NOT NULL,
      assignment_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      attempt_number INT NOT NULL DEFAULT 1 COMMENT 'Номер попытки (1, 2, 3...)',
      status ENUM('in_progress', 'completed', 'timeout', 'cancelled', 'violation') NOT NULL DEFAULT 'in_progress',
      questions_order JSON NULL COMMENT '[{questionId, shuffledOptions}]',
      current_question_index INT NOT NULL DEFAULT 0 COMMENT 'Текущий вопрос (для навигации)',
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at DATETIME(3) NULL,
      time_spent_seconds INT NULL COMMENT 'Потраченное время в секундах',
      total_points INT NULL COMMENT 'Набранные баллы',
      max_points INT NULL COMMENT 'Максимальные баллы',
      score_percent DECIMAL(5, 2) NULL COMMENT 'Процент правильных ответов',
      passed BOOLEAN NULL COMMENT 'Сдал ли тест',
      grade INT NULL COMMENT 'Итоговая оценка 0-100',
      violations JSON NULL COMMENT '[{type, timestamp, details}]',
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_assignment_student_attempt (assignment_id, student_id, attempt_number),
      INDEX idx_assignment_id (assignment_id),
      INDEX idx_student_id (student_id),
      INDEX idx_status (status),
      INDEX idx_started_at (started_at),
      INDEX idx_completed_at (completed_at),
      
      CONSTRAINT fk_test_sessions_assignment 
        FOREIGN KEY (assignment_id) REFERENCES test_assignments(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_sessions_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: test_sessions');

    // ============================================================================
    // 8. test_answers — Ответы студента на вопросы
    // ============================================================================
    await connection.query(`
    CREATE TABLE IF NOT EXISTS test_answers (
      id VARCHAR(191) NOT NULL,
      session_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      answer_data JSON NOT NULL COMMENT 'Ответ студента ({selectedOption: "b"} для single)',
      is_correct BOOLEAN NULL COMMENT 'Правильный ли ответ',
      points_earned INT NOT NULL DEFAULT 0 COMMENT 'Заработанные баллы',
      answered_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      time_spent_seconds INT NULL COMMENT 'Время на вопрос в секундах',
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_session_question (session_id, question_id),
      INDEX idx_session_id (session_id),
      INDEX idx_question_id (question_id),
      INDEX idx_is_correct (is_correct),
      INDEX idx_answered_at (answered_at),
      
      CONSTRAINT fk_test_answers_session 
        FOREIGN KEY (session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_answers_question 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    console.log('  ✅ Created table: test_answers');

    console.log('✅ Migration 20260104_028_testing_system completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 20260104_028_testing_system');

    // Удаляем таблицы в обратном порядке (из-за FK constraints)
    const tables = [
        'test_answers',
        'test_sessions',
        'test_assignments',
        'discipline_tests',
        'test_template_questions',
        'test_templates',
        'questions',
        'question_banks',
    ];

    for (const table of tables) {
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  ✅ Dropped table: ${table}`);
    }

    console.log('✅ Rollback 20260104_028_testing_system completed successfully');
};

export const description = 'Система тестирования студентов: банки вопросов, шаблоны тестов, назначения, сессии прохождения и ответы';
