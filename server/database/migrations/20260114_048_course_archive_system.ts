import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция 048: Система архивации учебных программ
 *
 * Добавляет поля для архивации учебных программ:
 * - is_archived: флаг архивации
 * - archived_at: дата архивации
 * - archived_by: кто архивировал
 *
 * Также создаются индексы для оптимизации запросов
 */

export const description = "Добавление системы архивации учебных программ";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding archive system to courses...");

  // Добавляем поля для архивации
  await connection.query(`
    ALTER TABLE courses
    ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Флаг архивации программы',
    ADD COLUMN archived_at DATETIME(3) NULL COMMENT 'Дата и время архивации',
    ADD COLUMN archived_by VARCHAR(191) NULL COMMENT 'ID пользователя, который архивировал программу'
  `);

  // Добавляем внешний ключ для archived_by
  await connection.query(`
    ALTER TABLE courses
    ADD CONSTRAINT fk_courses_archived_by
      FOREIGN KEY (archived_by) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  `);

  // Создаем индексы для производительности
  await connection.query(`
    CREATE INDEX idx_courses_archived ON courses(is_archived)
  `);

  console.log("✅ Archive system added to courses");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing archive system from courses...");

  // Удаляем индексы
  await connection.query(`
    DROP INDEX IF EXISTS idx_courses_archived ON courses
  `);

  // Удаляем внешний ключ
  await connection.query(`
    ALTER TABLE courses
    DROP FOREIGN KEY IF EXISTS fk_courses_archived_by
  `);

  // Удаляем колонки
  await connection.query(`
    ALTER TABLE courses
    DROP COLUMN IF EXISTS is_archived,
    DROP COLUMN IF EXISTS archived_at,
    DROP COLUMN IF EXISTS archived_by
  `);

  console.log("✅ Archive system removed from courses");
};
