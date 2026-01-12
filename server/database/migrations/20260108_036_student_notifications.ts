import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Таблица уведомлений студентов
 * Дата: 2026-01-08
 * Описание: Создание таблицы student_notifications для системы уведомлений
 */

export const description = 'Student notifications table';

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: 20260108_036_student_notifications');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS student_notifications (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      type ENUM(
        'TEST_UPCOMING',
        'TEST_TODAY',
        'TEST_OVERDUE',
        'DEADLINE_WARNING',
        'DEADLINE_CRITICAL',
        'SCHEDULE_CHANGE',
        'GRADE_POSTED'
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
      INDEX idx_created_at (created_at),
      INDEX idx_type (type),
      
      CONSTRAINT fk_student_notifications_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

    console.log('  ✅ Created table: student_notifications');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: 20260108_036_student_notifications');

    await connection.query('DROP TABLE IF EXISTS student_notifications');
    console.log('  ✅ Dropped table: student_notifications');
};
