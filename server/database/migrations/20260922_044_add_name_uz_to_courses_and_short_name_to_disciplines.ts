import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Узбекское название курса + короткое название дисциплины
 * Дата: 2026-09-22
 */

export const description =
  "Добавление поля name_uz в courses и short_name в disciplines";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260922_044_add_name_uz_to_courses_and_short_name_to_disciplines");

  await connection.query(`
    ALTER TABLE courses
    ADD COLUMN name_uz VARCHAR(255) NULL AFTER name;
  `);

  await connection.query(`
    ALTER TABLE disciplines
    ADD COLUMN short_name VARCHAR(20) NULL AFTER name;
  `);

  console.log("✅ Migration 20260922_044_add_name_uz_to_courses_and_short_name_to_disciplines completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260922_044_add_name_uz_to_courses_and_short_name_to_disciplines");

  await connection.query(`
    ALTER TABLE courses
    DROP COLUMN name_uz;
  `);

  await connection.query(`
    ALTER TABLE disciplines
    DROP COLUMN short_name;
  `);

  console.log("✅ Rollback completed successfully");
};
