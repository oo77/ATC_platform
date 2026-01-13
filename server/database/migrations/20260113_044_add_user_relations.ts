/**
 * Migration: Add student_id and instructor_id to users table
 * Adds foreign key references to students and instructors tables
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "Add student_id and instructor_id to users table for linking users with students/instructors";

export async function up(connection: PoolConnection): Promise<void> {
  // Добавляем поля student_id и instructor_id
  await connection.query(`
    ALTER TABLE users
    ADD COLUMN student_id CHAR(36) NULL AFTER pinfl,
    ADD COLUMN instructor_id CHAR(36) NULL AFTER student_id
  `);

  // Добавляем внешние ключи
  await connection.query(`
    ALTER TABLE users
    ADD CONSTRAINT fk_users_student
      FOREIGN KEY (student_id) REFERENCES students(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
  `);

  await connection.query(`
    ALTER TABLE users
    ADD CONSTRAINT fk_users_instructor
      FOREIGN KEY (instructor_id) REFERENCES instructors(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
  `);

  // Добавляем индексы
  await connection.query(`
    ALTER TABLE users
    ADD INDEX idx_student_id (student_id),
    ADD INDEX idx_instructor_id (instructor_id)
  `);

  console.log("✅ Added student_id and instructor_id columns to users table");
}

export async function down(connection: PoolConnection): Promise<void> {
  // Удаляем внешние ключи
  await connection.query(`
    ALTER TABLE users
    DROP FOREIGN KEY fk_users_student,
    DROP FOREIGN KEY fk_users_instructor
  `);

  // Удаляем индексы
  await connection.query(`
    ALTER TABLE users
    DROP INDEX idx_student_id,
    DROP INDEX idx_instructor_id
  `);

  // Удаляем столбцы
  await connection.query(`
    ALTER TABLE users
    DROP COLUMN student_id,
    DROP COLUMN instructor_id
  `);

  console.log(
    "✅ Removed student_id and instructor_id columns from users table"
  );
}
