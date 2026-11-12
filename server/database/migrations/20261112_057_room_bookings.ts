import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: бронирование аудиторий под курсы (планирование).
 * Дата: 2026-11-12
 *
 * Бронь — аудитория + курс + период дат + дни недели (+ инструктор).
 * Занимает аудиторию целыми днями. Группа неизвестна на этапе планирования,
 * поэтому group_id необязателен и проставляется позже.
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS room_bookings (
      id VARCHAR(191) PRIMARY KEY,
      classroom_id VARCHAR(191) NOT NULL,
      course_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NULL,
      group_id VARCHAR(191) NULL COMMENT 'Группа, когда она станет известна',
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      weekdays VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5' COMMENT 'Дни недели брони: 1=Пн … 7=Вс',
      note VARCHAR(500) NULL,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

      INDEX idx_rb_room_dates (classroom_id, date_from, date_to),
      INDEX idx_rb_instructor (instructor_id),
      INDEX idx_rb_course (course_id),
      INDEX idx_rb_group (group_id),
      INDEX idx_rb_dates (date_from, date_to),

      CONSTRAINT fk_rb_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_rb_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_rb_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_rb_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_rb_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT chk_rb_dates CHECK (date_to >= date_from)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query('DROP TABLE IF EXISTS room_bookings');
};

export const description = 'room_bookings: бронирование аудиторий под курсы (дни, инструктор, аудитория)';
