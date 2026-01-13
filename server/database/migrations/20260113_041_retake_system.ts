import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Система пересдач (Retake System)
 * Дата: 2026-01-13
 * Описание: Добавление поля allowed_student_ids в таблицу test_assignments
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260113_041_retake_system");

  await connection.query(`
        ALTER TABLE test_assignments 
        ADD COLUMN allowed_student_ids JSON NULL COMMENT 'Список ID студентов, допущенных к тесту (для пересдач)';
    `);

  console.log("  ✅ Added column: allowed_student_ids to test_assignments");
  console.log("✅ Migration 20260113_041_retake_system completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260113_041_retake_system");

  await connection.query(`
        ALTER TABLE test_assignments 
        DROP COLUMN allowed_student_ids;
    `);

  console.log("✅ Rollback 20260113_041_retake_system completed successfully");
};

export const description =
  "Добавление поддержки пересдач (allowed_student_ids)";
