import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Добавление ИНН и реквизитов организации
 * Дата: 2026-07-30
 * Описание: Добавляет в таблицу organizations поля inn, legal_address, contact_person, mfo, account_number, oked.
 */

export const description =
  "Добавление ИНН, юридического адреса, контактного лица и банковских реквизитов для организаций";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260730_037_add_inn_and_details_to_organizations");

  await connection.query(`
    ALTER TABLE organizations
    ADD COLUMN inn VARCHAR(12) NULL COMMENT 'ИНН организации' AFTER code,
    ADD COLUMN legal_address TEXT NULL COMMENT 'Юридический адрес' AFTER address,
    ADD COLUMN contact_person VARCHAR(255) NULL COMMENT 'Контактное лицо / Руководитель' AFTER contact_email,
    ADD COLUMN mfo VARCHAR(5) NULL COMMENT 'МФО банка' AFTER legal_address,
    ADD COLUMN account_number VARCHAR(20) NULL COMMENT 'Расчетный счет' AFTER mfo,
    ADD COLUMN oked VARCHAR(10) NULL COMMENT 'ОКЭД' AFTER account_number,
    ADD UNIQUE INDEX idx_organizations_inn (inn);
  `);

  console.log("✅ Migration 20260730_037_add_inn_and_details_to_organizations completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260730_037_add_inn_and_details_to_organizations");

  await connection.query(`
    ALTER TABLE organizations
    DROP INDEX idx_organizations_inn,
    DROP COLUMN inn,
    DROP COLUMN legal_address,
    DROP COLUMN contact_person,
    DROP COLUMN mfo,
    DROP COLUMN account_number,
    DROP COLUMN oked;
  `);

  console.log("✅ Rollback completed successfully");
};
