import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Роль "Ответственный" в комиссии аттестации
 * Дата: 2026-08-13
 * Описание: Протокол экзамена требует отдельного поля "Ф.И.О. ответственного"
 *   (лицо, ответственное за проведение экзамена) — добавляется как ещё одна
 *   роль в attestation_group_commission, наравне с председателем/секретарём/
 *   членом комиссии.
 */

export const description = "Add 'responsible' role to attestation commission";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Attestation responsible role");

  await connection.query(`
    ALTER TABLE attestation_group_commission
    MODIFY COLUMN role ENUM('chairman', 'secretary', 'member', 'responsible') NOT NULL DEFAULT 'member'
  `);

  console.log("✅ Attestation responsible role migration completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: Attestation responsible role");

  await connection.query(`
    UPDATE attestation_group_commission SET role = 'member' WHERE role = 'responsible'
  `);
  await connection.query(`
    ALTER TABLE attestation_group_commission
    MODIFY COLUMN role ENUM('chairman', 'secretary', 'member') NOT NULL DEFAULT 'member'
  `);

  console.log("✅ Rollback completed successfully");
};
