/**
 * Миграция: Модификация FK для поддержки preview-сессий
 * Дата: 2026-01-05
 * 
 * Preview-сессии не привязаны к assignment, поэтому assignment_id должен быть NULL
 */

import type { PoolConnection } from 'mysql2/promise';

export const id = '20260105_030_preview_sessions_nullable_assignment';
export const name = 'Allow nullable assignment_id for preview sessions';

export async function up(connection: PoolConnection): Promise<void> {
    // Удаляем существующий FK constraint
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_assignment
  `);

    // Делаем assignment_id nullable
    await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN assignment_id VARCHAR(36) NULL
  `);

    // Пересоздаем FK constraint с ON DELETE SET NULL для preview-совместимости
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_assignment
    FOREIGN KEY (assignment_id) REFERENCES test_assignments(id)
    ON DELETE SET NULL
  `);
}

export async function down(connection: PoolConnection): Promise<void> {
    // Удаляем всех preview-сессии перед откатом
    await connection.execute(`
    DELETE FROM test_sessions WHERE is_preview = TRUE
  `);

    // Удаляем FK
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_assignment
  `);

    // Возвращаем NOT NULL
    await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN assignment_id VARCHAR(36) NOT NULL
  `);

    // Восстанавливаем original FK
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_assignment
    FOREIGN KEY (assignment_id) REFERENCES test_assignments(id)
    ON DELETE CASCADE
  `);
}
