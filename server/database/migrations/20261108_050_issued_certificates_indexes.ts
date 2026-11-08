import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: индексы для базы сертификатов (список, счётчики, аналитика)
 * Дата: 2026-11-08
 */

const INDEXES: [string, string][] = [
  ['idx_ic_status_issue_date', '(status, issue_date)'],
  ['idx_ic_student', '(student_id)'],
  ['idx_ic_source', '(source_type, import_source)'],
  ['idx_ic_expiry', '(expiry_date)'],
];

async function indexExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'issued_certificates' AND index_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

export const up = async (connection: PoolConnection): Promise<void> => {
  for (const [name, cols] of INDEXES) {
    if (!(await indexExists(connection, name))) {
      await connection.query(`ALTER TABLE issued_certificates ADD INDEX ${name} ${cols}`);
    }
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  for (const [name] of INDEXES) {
    if (await indexExists(connection, name)) {
      await connection.query(`ALTER TABLE issued_certificates DROP INDEX ${name}`);
    }
  }
};

export const description = 'Индексы issued_certificates для списка и аналитики';
