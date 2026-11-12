import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: автор брони аудитории.
 * Дата: 2026-11-12
 *
 * schedule_events.created_by — пользователь, создавший занятие («кто забронировал»).
 * Для уже существующих занятий автор восстанавливается из activity_logs
 * (CREATE SCHEDULE: одиночные — по entity_id, пакетные — по details.createdEventIds).
 * Не нашли запись в журнале — остаётся NULL.
 */

async function columnExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'schedule_events' AND column_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

async function indexExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'schedule_events' AND index_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

async function constraintExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = 'schedule_events' AND constraint_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

function parseDetails(raw: unknown): Record<string, any> | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as Record<string, any>;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

async function backfillAuthors(c: PoolConnection): Promise<void> {
  const [logTable] = await c.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'activity_logs' LIMIT 1`,
  );
  if ((logTable as any[]).length === 0) return;

  const [userRows] = await c.query('SELECT id FROM users');
  const users = new Set((userRows as any[]).map((u) => String(u.id)));

  const [logRows] = await c.query(
    `SELECT user_id, entity_id, details FROM activity_logs
     WHERE entity_type = 'SCHEDULE' AND action_type = 'CREATE'
     ORDER BY id ASC`,
  );

  // eventId -> userId (самая ранняя запись в журнале выигрывает)
  const authorByEvent = new Map<string, string>();
  for (const row of logRows as any[]) {
    const userId = String(row.user_id);
    if (!users.has(userId)) continue;
    const ids: string[] = [];
    if (row.entity_id) ids.push(String(row.entity_id));
    const details = parseDetails(row.details);
    if (Array.isArray(details?.createdEventIds)) {
      for (const id of details!.createdEventIds) ids.push(String(id));
    }
    for (const id of ids) {
      if (!authorByEvent.has(id)) authorByEvent.set(id, userId);
    }
  }

  // Группируем по автору — один UPDATE на пачку id
  const byUser = new Map<string, string[]>();
  for (const [eventId, userId] of authorByEvent) {
    const list = byUser.get(userId) ?? [];
    list.push(eventId);
    byUser.set(userId, list);
  }

  const CHUNK = 500;
  for (const [userId, eventIds] of byUser) {
    for (let i = 0; i < eventIds.length; i += CHUNK) {
      const chunk = eventIds.slice(i, i + CHUNK);
      await c.query(
        `UPDATE schedule_events SET created_by = ? WHERE created_by IS NULL AND id IN (${chunk.map(() => '?').join(',')})`,
        [userId, ...chunk],
      );
    }
  }
}

export const up = async (connection: PoolConnection): Promise<void> => {
  if (!(await columnExists(connection, 'created_by'))) {
    await connection.query(
      `ALTER TABLE schedule_events ADD COLUMN created_by VARCHAR(191) NULL COMMENT 'Кто создал занятие (автор брони)'`,
    );
  }
  if (!(await indexExists(connection, 'idx_schedule_created_by'))) {
    await connection.query(`ALTER TABLE schedule_events ADD INDEX idx_schedule_created_by (created_by)`);
  }
  if (!(await constraintExists(connection, 'fk_schedule_created_by'))) {
    await connection.query(
      `ALTER TABLE schedule_events
       ADD CONSTRAINT fk_schedule_created_by FOREIGN KEY (created_by) REFERENCES users(id)
       ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  await backfillAuthors(connection);
};

export const down = async (connection: PoolConnection): Promise<void> => {
  if (await constraintExists(connection, 'fk_schedule_created_by')) {
    await connection.query(`ALTER TABLE schedule_events DROP FOREIGN KEY fk_schedule_created_by`);
  }
  if (await indexExists(connection, 'idx_schedule_created_by')) {
    await connection.query(`ALTER TABLE schedule_events DROP INDEX idx_schedule_created_by`);
  }
  if (await columnExists(connection, 'created_by')) {
    await connection.query(`ALTER TABLE schedule_events DROP COLUMN created_by`);
  }
};

export const description = 'schedule_events: created_by (автор брони) + восстановление из activity_logs';
