import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 004: Student Portal Module
 * Date: 2026-01-10
 * Description: Tables for Student Portal features:
 *   - user_settings (Theme, Language, Notification prefs)
 *   - support_tickets (Help desk)
 *   - student_notifications (In-app notifications)
 */

export const description = "Student Portal Module";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Student Portal Module");

  // 1. User Settings
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
      
      CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. Support Tickets
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
      CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_support_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. Student Notifications
  await connection.query(`
    CREATE TABLE IF NOT EXISTS student_notifications (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      type ENUM(
        'TEST_UPCOMING', 'TEST_TODAY', 'TEST_OVERDUE',
        'DEADLINE_WARNING', 'DEADLINE_CRITICAL',
        'SCHEDULE_CHANGE', 'GRADE_POSTED'
      ) NOT NULL,
      priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(500) NULL,
      metadata JSON NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_is_read (is_read),
      CONSTRAINT fk_student_notifications_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("✅ Student Portal tables created");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Student Portal Module");
  await connection.query("DROP TABLE IF EXISTS student_notifications");
  await connection.query("DROP TABLE IF EXISTS support_tickets");
  await connection.query("DROP TABLE IF EXISTS user_settings");
};
