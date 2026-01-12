import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: [Краткое описание]
 * Дата: YYYY-MM-DD
 * Описание: [Подробное описание того, что делает эта миграция]
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: [migration_name]');

  // TODO: Добавьте SQL-запросы для применения изменений
  await connection.query(`
    -- Ваш SQL код здесь
  `);

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: [migration_name]');

  // TODO: Добавьте SQL-запросы для отката изменений
  await connection.query(`
    -- Ваш SQL код для отката здесь
  `);

  console.log('✅ Rollback completed successfully');
};

export const description = '[Краткое описание миграции]';
