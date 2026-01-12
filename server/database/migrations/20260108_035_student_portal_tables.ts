import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Таблицы для портала студента (Настройки и Поддержка)
 * Дата: 2026-01-08
 * Описание: Создание таблиц:
 *   - user_settings (настройки пользователя)
 *   - support_tickets (тикеты поддержки)
 */

export const description = 'User settings and support tickets tables';

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: 20260108_035_student_portal_tables');

  // ============================================================================
  // 1. user_settings — Настройки пользователя
  // ============================================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id VARCHAR(191) NOT NULL PRIMARY KEY,
      theme ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'light',
      language ENUM('ru', 'en', 'uz') NOT NULL DEFAULT 'ru',
      notifications_email BOOLEAN NOT NULL DEFAULT TRUE,
      notifications_push BOOLEAN NOT NULL DEFAULT TRUE,
      notifications_sms BOOLEAN NOT NULL DEFAULT FALSE,
      compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
      font_size ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
      sidebar_color VARCHAR(50) DEFAULT 'default',
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_user_settings_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✅ Created table: user_settings');

  // ============================================================================
  // 2. support_tickets — Тикеты поддержки
  // ============================================================================
  await connection.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      ticket_type ENUM('technical', 'question', 'feature', 'bug', 'other') NOT NULL,
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      subject VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      attachments JSON NULL,
      status ENUM('new', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'new',
      assigned_to VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      resolved_at DATETIME(3) NULL,
      
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_assigned_to (assigned_to),
      
      CONSTRAINT fk_support_tickets_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_support_tickets_assigned_to 
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✅ Created table: support_tickets');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: 20260108_035_student_portal_tables');

  await connection.query('DROP TABLE IF EXISTS support_tickets');
  console.log('  ✅ Dropped table: support_tickets');

  await connection.query('DROP TABLE IF EXISTS user_settings');
  console.log('  ✅ Dropped table: user_settings');
};
