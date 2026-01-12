/**
 * Миграция: Модификация FK student_id для поддержки preview-сессий
 * Дата: 2026-01-05
 * 
 * Preview-сессии запускаются преподавателями/админами для предпросмотра теста,
 * поэтому student_id должен быть NULL, а вместо него используется preview_user_id
 */

import type { PoolConnection } from 'mysql2/promise';

export const id = '20260105_031_preview_sessions_nullable_student';
export const name = 'Allow nullable student_id for preview sessions';

export async function up(connection: PoolConnection): Promise<void> {
    console.log('🔄 Running migration: 20260105_031_preview_sessions_nullable_student');

    // 1. Добавляем поле preview_user_id для хранения ID пользователя, делающего preview
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD COLUMN preview_user_id VARCHAR(191) NULL 
    COMMENT 'ID пользователя (учитель/админ), запустившего preview'
    AFTER is_preview
  `);
    console.log('  ✅ Added column: preview_user_id');

    // 2. Добавляем FK на users для preview_user_id
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_preview_user
    FOREIGN KEY (preview_user_id) REFERENCES users(id)
    ON DELETE SET NULL
  `);
    console.log('  ✅ Added FK: fk_test_sessions_preview_user');

    // 3. Удаляем существующий FK constraint для student_id
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_student
  `);
    console.log('  ✅ Dropped FK: fk_test_sessions_student');

    // 4. Делаем student_id nullable
    await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN student_id VARCHAR(191) NULL
  `);
    console.log('  ✅ Modified column: student_id is now nullable');

    // 5. Пересоздаем FK constraint с ON DELETE SET NULL
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL
  `);
    console.log('  ✅ Recreated FK: fk_test_sessions_student with ON DELETE SET NULL');

    // 6. Добавляем индекс на preview_user_id
    await connection.execute(`
    CREATE INDEX idx_test_sessions_preview_user 
    ON test_sessions(preview_user_id)
  `);
    console.log('  ✅ Added index: idx_test_sessions_preview_user');

    console.log('✅ Migration 20260105_031_preview_sessions_nullable_student completed');
}

export async function down(connection: PoolConnection): Promise<void> {
    console.log('🔄 Rolling back migration: 20260105_031_preview_sessions_nullable_student');

    // 1. Удаляем все preview-сессии (они не могут существовать с NOT NULL student_id)
    await connection.execute(`
    DELETE FROM test_sessions WHERE is_preview = TRUE OR student_id IS NULL
  `);
    console.log('  ✅ Deleted preview sessions');

    // 2. Удаляем индекс preview_user_id
    await connection.execute(`
    DROP INDEX idx_test_sessions_preview_user ON test_sessions
  `);
    console.log('  ✅ Dropped index: idx_test_sessions_preview_user');

    // 3. Удаляем FK preview_user_id
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_preview_user
  `);
    console.log('  ✅ Dropped FK: fk_test_sessions_preview_user');

    // 4. Удаляем колонку preview_user_id
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP COLUMN preview_user_id
  `);
    console.log('  ✅ Dropped column: preview_user_id');

    // 5. Удаляем текущий FK student_id
    await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_student
  `);
    console.log('  ✅ Dropped FK: fk_test_sessions_student');

    // 6. Возвращаем NOT NULL для student_id
    await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN student_id VARCHAR(191) NOT NULL
  `);
    console.log('  ✅ Modified column: student_id is now NOT NULL');

    // 7. Восстанавливаем original FK с ON DELETE CASCADE
    await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
  `);
    console.log('  ✅ Recreated FK: fk_test_sessions_student with ON DELETE CASCADE');

    console.log('✅ Rollback 20260105_031_preview_sessions_nullable_student completed');
}
