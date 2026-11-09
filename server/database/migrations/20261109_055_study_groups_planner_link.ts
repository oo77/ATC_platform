import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: связь учебной группы ATC с группой Course Planner 2.
 * Дата: 2026-11-09
 *
 * planner_group_id  — id группы в course-planner2 (NULL — группа не связана).
 * planner_synced_at — время последней синхронизации данных из планера.
 * Одна группа планера может быть связана максимум с одной группой ATC.
 */

async function columnExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'study_groups' AND column_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

async function indexExists(c: PoolConnection, name: string): Promise<boolean> {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'study_groups' AND index_name = ? LIMIT 1`,
    [name],
  );
  return (rows as any[]).length > 0;
}

export const up = async (connection: PoolConnection): Promise<void> => {
  if (!(await columnExists(connection, 'planner_group_id'))) {
    await connection.query(
      `ALTER TABLE study_groups ADD COLUMN planner_group_id VARCHAR(191) NULL COMMENT 'ID группы в Course Planner 2'`,
    );
  }
  if (!(await columnExists(connection, 'planner_synced_at'))) {
    await connection.query(
      `ALTER TABLE study_groups ADD COLUMN planner_synced_at DATETIME(3) NULL COMMENT 'Последняя синхронизация с Course Planner 2'`,
    );
  }
  if (!(await indexExists(connection, 'uq_study_groups_planner_group'))) {
    await connection.query(
      `ALTER TABLE study_groups ADD UNIQUE INDEX uq_study_groups_planner_group (planner_group_id)`,
    );
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  if (await indexExists(connection, 'uq_study_groups_planner_group')) {
    await connection.query(`ALTER TABLE study_groups DROP INDEX uq_study_groups_planner_group`);
  }
  if (await columnExists(connection, 'planner_synced_at')) {
    await connection.query(`ALTER TABLE study_groups DROP COLUMN planner_synced_at`);
  }
  if (await columnExists(connection, 'planner_group_id')) {
    await connection.query(`ALTER TABLE study_groups DROP COLUMN planner_group_id`);
  }
};

export const description = 'study_groups: planner_group_id и planner_synced_at для связи с Course Planner 2';
