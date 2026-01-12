/**
 * Миграция 033: Поддержка оценок из тестов
 * Добавляет поля для отслеживания автоматических оценок из тестов
 * и возможности отметить изменённые оценки
 */

import type { PoolConnection } from 'mysql2/promise';

export const description = 'Добавление полей для оценок из тестов и отслеживания изменений';

export async function up(connection: PoolConnection): Promise<void> {
    console.log('  Adding test-related fields to grades table...');

    // Добавляем поле is_from_test - оценка автоматически выставлена из теста
    await connection.query(`
    ALTER TABLE grades
    ADD COLUMN is_from_test BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT 'Оценка автоматически выставлена из теста'
    AFTER grade
  `);
    console.log('  ✅ Added column: is_from_test');

    // Добавляем поле test_session_id - ссылка на сессию теста
    await connection.query(`
    ALTER TABLE grades
    ADD COLUMN test_session_id VARCHAR(191) NULL 
    COMMENT 'ID сессии теста (если оценка из теста)'
    AFTER is_from_test
  `);
    console.log('  ✅ Added column: test_session_id');

    // Добавляем поле original_grade - исходная оценка (до изменения)
    await connection.query(`
    ALTER TABLE grades
    ADD COLUMN original_grade INT NULL 
    COMMENT 'Исходная оценка из теста (до изменения инструктором)'
    AFTER test_session_id
  `);
    console.log('  ✅ Added column: original_grade');

    // Добавляем поле is_modified - оценка была изменена инструктором
    await connection.query(`
    ALTER TABLE grades
    ADD COLUMN is_modified BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT 'Оценка была изменена инструктором вручную'
    AFTER original_grade
  `);
    console.log('  ✅ Added column: is_modified');

    // Добавляем поле modified_by - кто изменил оценку
    await connection.query(`
    ALTER TABLE grades
    ADD COLUMN modified_by VARCHAR(191) NULL 
    COMMENT 'Кто изменил оценку'
    AFTER is_modified
  `);
    console.log('  ✅ Added column: modified_by');

    // Добавляем поле modified_at - когда изменена
    await connection.query(`
    ALTER TABLE grades
    ADD COLUMN modified_at DATETIME(3) NULL 
    COMMENT 'Когда была изменена оценка'
    AFTER modified_by
  `);
    console.log('  ✅ Added column: modified_at');

    // Добавляем индекс для поиска оценок из тестов
    await connection.query(`
    CREATE INDEX idx_grades_from_test ON grades(is_from_test)
  `);
    console.log('  ✅ Added index: idx_grades_from_test');

    // Добавляем индекс для поиска изменённых оценок
    await connection.query(`
    CREATE INDEX idx_grades_modified ON grades(is_modified)
  `);
    console.log('  ✅ Added index: idx_grades_modified');

    // Добавляем FK на test_sessions
    await connection.query(`
    ALTER TABLE grades
    ADD CONSTRAINT fk_grades_test_session
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id)
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
    console.log('  ✅ Added FK: fk_grades_test_session');

    // Добавляем FK на users для modified_by
    await connection.query(`
    ALTER TABLE grades
    ADD CONSTRAINT fk_grades_modified_by
    FOREIGN KEY (modified_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
    console.log('  ✅ Added FK: fk_grades_modified_by');

    console.log('  ✅ Migration 033 completed: grades from test support added');
}

export async function down(connection: PoolConnection): Promise<void> {
    console.log('  Removing test-related fields from grades table...');

    // Удаляем FK
    try {
        await connection.query('ALTER TABLE grades DROP FOREIGN KEY fk_grades_modified_by');
    } catch (e) {
        console.log('  Note: FK fk_grades_modified_by may not exist');
    }

    try {
        await connection.query('ALTER TABLE grades DROP FOREIGN KEY fk_grades_test_session');
    } catch (e) {
        console.log('  Note: FK fk_grades_test_session may not exist');
    }

    // Удаляем индексы
    try {
        await connection.query('DROP INDEX idx_grades_modified ON grades');
    } catch (e) {
        console.log('  Note: Index idx_grades_modified may not exist');
    }

    try {
        await connection.query('DROP INDEX idx_grades_from_test ON grades');
    } catch (e) {
        console.log('  Note: Index idx_grades_from_test may not exist');
    }

    // Удаляем колонки
    await connection.query('ALTER TABLE grades DROP COLUMN IF EXISTS modified_at');
    await connection.query('ALTER TABLE grades DROP COLUMN IF EXISTS modified_by');
    await connection.query('ALTER TABLE grades DROP COLUMN IF EXISTS is_modified');
    await connection.query('ALTER TABLE grades DROP COLUMN IF EXISTS original_grade');
    await connection.query('ALTER TABLE grades DROP COLUMN IF EXISTS test_session_id');
    await connection.query('ALTER TABLE grades DROP COLUMN IF EXISTS is_from_test');

    console.log('  ✅ Migration 033 rolled back');
}
