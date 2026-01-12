/**
 * Миграция: Добавление поддержки preview-режима для тестов
 * Дата: 2026-01-05
 */

import type { PoolConnection } from 'mysql2/promise';

export const id = '20260105_029_test_preview_mode';
export const name = 'Add preview mode support for test sessions';

export async function up(connection: PoolConnection): Promise<void> {
    // Добавляем поле is_preview в таблицу test_sessions
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD COLUMN is_preview BOOLEAN NOT NULL DEFAULT FALSE
    AFTER status
  `);

    // Создаём индекс для быстрого поиска preview-сессий
    await connection.execute(`
    CREATE INDEX idx_test_sessions_preview 
    ON test_sessions(is_preview, created_at)
  `);

    // Комментарий к полю
    await connection.execute(`
    ALTER TABLE test_sessions 
    MODIFY COLUMN is_preview BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT 'Флаг preview-режима (для предпросмотра теста преподавателем)'
  `);
}

export async function down(connection: PoolConnection): Promise<void> {
    // Удаляем индекс
    await connection.execute(`
    DROP INDEX idx_test_sessions_preview ON test_sessions
  `);

    // Удаляем поле is_preview
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP COLUMN is_preview
  `);
}
