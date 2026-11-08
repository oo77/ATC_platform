import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: аналитика и безопасность библиотеки
 * Дата: 2026-11-08
 *
 * - book_reading_sessions: реальное время чтения (active_seconds) и число
 *   просмотренных страниц (pages_viewed) + индексы для аналитики по периодам.
 * - book_reading_progress: максимальная прочитанная страница, суммарное время,
 *   дата первого чтения и дата завершения книги.
 * - book_access: индекс по роли (каталог фильтрует по role_name).
 * - activity_logs.entity_type: возвращает значение LIBRARY_BOOK (потеряно в 033),
 *   чтобы действия с библиотекой попадали в журнал.
 */

async function columnExists(c: PoolConnection, table: string, column: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [table, column],
  );
  return (rows as any[]).length > 0;
}

async function indexExists(c: PoolConnection, table: string, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
    [table, name],
  );
  return (rows as any[]).length > 0;
}

const COLUMNS: [string, string, string][] = [
  ["book_reading_sessions", "active_seconds", "INT NOT NULL DEFAULT 0"],
  ["book_reading_sessions", "pages_viewed", "INT NOT NULL DEFAULT 0"],
  ["book_reading_progress", "max_page", "INT NOT NULL DEFAULT 0"],
  ["book_reading_progress", "total_seconds", "INT NOT NULL DEFAULT 0"],
  ["book_reading_progress", "first_read_at", "TIMESTAMP NULL"],
  ["book_reading_progress", "completed_at", "TIMESTAMP NULL"],
];

const INDEXES: [string, string, string][] = [
  ["book_reading_sessions", "idx_brs_book_started", "(book_id, started_at)"],
  ["book_reading_sessions", "idx_brs_user_started", "(user_id, started_at)"],
  ["book_reading_sessions", "idx_brs_open", "(ended_at, last_activity_at)"],
  ["book_reading_progress", "idx_brp_user", "(user_id, last_read_at)"],
  ["book_access", "idx_book_access_role", "(role_name)"],
];

export const up = async (connection: PoolConnection): Promise<void> => {
  for (const [table, column, def] of COLUMNS) {
    if (!(await columnExists(connection, table, column))) {
      await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  }

  for (const [table, name, cols] of INDEXES) {
    if (!(await indexExists(connection, table, name))) {
      await connection.query(`ALTER TABLE ${table} ADD INDEX ${name} ${cols}`);
    }
  }

  // Заполняем новые поля прогресса по уже накопленным данным
  await connection.query(
    `UPDATE book_reading_progress SET max_page = last_page WHERE max_page < last_page`,
  );
  await connection.query(
    `UPDATE book_reading_progress p
     JOIN books b ON b.id = p.book_id
     SET p.completed_at = p.last_read_at
     WHERE p.completed_at IS NULL AND b.total_pages > 0 AND p.max_page >= b.total_pages`,
  );
  await connection.query(
    `UPDATE book_reading_progress p
     SET p.first_read_at = (
       SELECT MIN(s.started_at) FROM book_reading_sessions s
       WHERE s.book_id = p.book_id AND s.user_id = p.user_id
     )
     WHERE p.first_read_at IS NULL`,
  );

  // Старые «зависшие» сессии (вкладку закрыли без end) закрываем по последней активности
  await connection.query(
    `UPDATE book_reading_sessions
     SET ended_at = last_activity_at
     WHERE ended_at IS NULL AND last_activity_at < NOW() - INTERVAL 10 MINUTE`,
  );

  // Возвращаем LIBRARY_BOOK в enum журнала действий
  const [rows] = await connection.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'activity_logs' AND column_name = 'entity_type'`,
  );
  const columnType: string | undefined = (rows as any[])[0]?.t;
  if (columnType && columnType.startsWith("enum(") && !columnType.includes("'LIBRARY_BOOK'")) {
    const values = columnType.slice(5, -1);
    await connection.query(
      `ALTER TABLE activity_logs MODIFY COLUMN entity_type ENUM(${values}, 'LIBRARY_BOOK') NOT NULL`,
    );
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  for (const [table, name] of INDEXES) {
    if (await indexExists(connection, table, name)) {
      await connection.query(`ALTER TABLE ${table} DROP INDEX ${name}`);
    }
  }
  for (const [table, column] of COLUMNS) {
    if (await columnExists(connection, table, column)) {
      await connection.query(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    }
  }
};

export const description = "Библиотека: время чтения, завершение книг, индексы аналитики";
