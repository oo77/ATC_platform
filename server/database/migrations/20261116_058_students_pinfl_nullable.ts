import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: ПИНФЛ слушателя становится необязательным.
 * Дата: 2026-11-16
 *
 * students.pinfl: NOT NULL UNIQUE → NULL UNIQUE.
 * UNIQUE сохраняется (в MySQL/MariaDB допускает несколько NULL).
 * Пустые строки переводятся в NULL, чтобы не конфликтовать по уникальности.
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  await connection.query('ALTER TABLE students MODIFY pinfl VARCHAR(14) NULL');
  await connection.query("UPDATE students SET pinfl = NULL WHERE pinfl = ''");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  // Возврат NOT NULL возможен только если нет слушателей без ПИНФЛ
  const [rows]: any = await connection.query('SELECT COUNT(*) AS cnt FROM students WHERE pinfl IS NULL');
  if (Number(rows?.[0]?.cnt || 0) > 0) {
    throw new Error('Нельзя вернуть NOT NULL: есть слушатели без ПИНФЛ');
  }
  await connection.query('ALTER TABLE students MODIFY pinfl VARCHAR(14) NOT NULL');
};

export const description = 'students.pinfl: ПИНФЛ слушателя необязателен (NULL)';
