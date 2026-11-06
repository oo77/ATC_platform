import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Трехъязычные ФИО инструкторов
 * Дата: 2026-10-29
 */

export const description =
  "Добавление полей full_name_ru, short_name_uz, short_name_ru в таблицу instructors";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20261029_047_add_instructor_multilingual_names");

  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN full_name_ru VARCHAR(255) NULL AFTER full_name,
    ADD COLUMN short_name_uz VARCHAR(255) NULL AFTER full_name_ru,
    ADD COLUMN short_name_ru VARCHAR(255) NULL AFTER short_name_uz;
  `);

  console.log("✅ Migration 20261029_047_add_instructor_multilingual_names completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20261029_047_add_instructor_multilingual_names");

  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN full_name_ru,
    DROP COLUMN short_name_uz,
    DROP COLUMN short_name_ru;
  `);

  console.log("✅ Rollback completed successfully");
};
