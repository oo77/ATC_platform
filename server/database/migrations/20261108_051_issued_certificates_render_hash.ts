import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: отслеживание версии шаблона, по которой отрисован PDF сертификата.
 * Дата: 2026-11-08
 *
 * render_hash — SHA-1 от template_data на момент генерации PDF.
 * NULL = неизвестно (сертификат выдан до появления отслеживания).
 */

async function columnExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'issued_certificates' AND column_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

async function indexExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'issued_certificates' AND index_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

export const up = async (connection: PoolConnection): Promise<void> => {
  if (!(await columnExists(connection, 'render_hash'))) {
    await connection.query(`ALTER TABLE issued_certificates ADD COLUMN render_hash CHAR(40) NULL`);
  }
  if (!(await columnExists(connection, 'rendered_at'))) {
    await connection.query(`ALTER TABLE issued_certificates ADD COLUMN rendered_at DATETIME NULL`);
  }
  if (!(await indexExists(connection, 'idx_ic_template_status'))) {
    await connection.query(`ALTER TABLE issued_certificates ADD INDEX idx_ic_template_status (template_id, status)`);
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  if (await indexExists(connection, 'idx_ic_template_status')) {
    await connection.query(`ALTER TABLE issued_certificates DROP INDEX idx_ic_template_status`);
  }
  if (await columnExists(connection, 'rendered_at')) {
    await connection.query(`ALTER TABLE issued_certificates DROP COLUMN rendered_at`);
  }
  if (await columnExists(connection, 'render_hash')) {
    await connection.query(`ALTER TABLE issued_certificates DROP COLUMN render_hash`);
  }
};

export const description = 'issued_certificates: render_hash и rendered_at для отслеживания версии шаблона';
