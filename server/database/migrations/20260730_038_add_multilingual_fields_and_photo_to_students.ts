import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Добавление трехъязычных полей службы и должности в таблицу students
 * Дата: 2026-07-30
 */

export const description =
  "Добавление полей department_uz/en/ru и position_uz/en/ru в таблицу students";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260730_038_add_multilingual_fields_and_photo_to_students");

  await connection.query(`
    ALTER TABLE students
    ADD COLUMN department_uz VARCHAR(255) NULL AFTER department,
    ADD COLUMN department_en VARCHAR(255) NULL AFTER department_uz,
    ADD COLUMN department_ru VARCHAR(255) NULL AFTER department_en,
    ADD COLUMN position_uz VARCHAR(255) NULL AFTER position,
    ADD COLUMN position_en VARCHAR(255) NULL AFTER position_uz,
    ADD COLUMN position_ru VARCHAR(255) NULL AFTER position_en;
  `);

  console.log("✅ Migration 20260730_038_add_multilingual_fields_and_photo_to_students completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260730_038_add_multilingual_fields_and_photo_to_students");

  await connection.query(`
    ALTER TABLE students
    DROP COLUMN department_uz,
    DROP COLUMN department_en,
    DROP COLUMN department_ru,
    DROP COLUMN position_uz,
    DROP COLUMN position_en,
    DROP COLUMN position_ru;
  `);

  console.log("✅ Rollback completed successfully");
};
