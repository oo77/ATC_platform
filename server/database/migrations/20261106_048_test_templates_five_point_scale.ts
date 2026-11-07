import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: пятибалльная шкала оценок в шаблонах тестов
 * Дата: 2026-11-06
 */

export const description =
  "Добавление флага use_five_point_scale в test_templates (86–100 → 5, 71–85 → 4, 56–70 → 3, ≤55 → 2)";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20261106_048_test_templates_five_point_scale");

  await connection.query(`
    ALTER TABLE test_templates
    ADD COLUMN use_five_point_scale TINYINT(1) NOT NULL DEFAULT 0 AFTER passing_score;
  `);

  console.log("✅ Migration 20261106_048_test_templates_five_point_scale completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(`ALTER TABLE test_templates DROP COLUMN use_five_point_scale;`);
};
