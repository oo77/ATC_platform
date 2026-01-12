import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Многоязычная поддержка для системы тестирования
 * Дата: 2026-01-05
 * 
 * Изменения:
 * 1. questions.language - язык вопроса (en, ru, uz), по умолчанию 'ru'
 * 2. test_templates.allowed_languages - JSON массив разрешённых языков
 * 3. test_sessions.language - выбранный язык тестирования
 * 
 * Все существующие вопросы получат language = 'ru' по умолчанию.
 * Существующие шаблоны получат allowed_languages = NULL (все языки).
 */

export const id = '20260105_032_multilang_questions';
export const name = 'Multilingual questions support';
export const description = 'Добавление многоязычной поддержки: language для вопросов и сессий, allowed_languages для шаблонов';

export async function up(connection: PoolConnection): Promise<void> {
    console.log('🔄 Running migration: 20260105_032_multilang_questions');

    // ========================================================================
    // 1. Добавляем язык к вопросам
    // ========================================================================
    await connection.execute(`
        ALTER TABLE questions 
        ADD COLUMN language ENUM('en', 'ru', 'uz') NOT NULL DEFAULT 'ru' 
        COMMENT 'Язык вопроса: en=English, ru=Русский, uz=O''zbek'
        AFTER difficulty
    `);
    console.log('  ✅ Added column: questions.language (default: ru)');

    // Индекс для фильтрации по языку
    await connection.execute(`
        CREATE INDEX idx_questions_language ON questions(language)
    `);
    console.log('  ✅ Added index: idx_questions_language');

    // Составной индекс для фильтрации по банку и языку
    await connection.execute(`
        CREATE INDEX idx_questions_bank_language ON questions(bank_id, language)
    `);
    console.log('  ✅ Added index: idx_questions_bank_language');

    // ========================================================================
    // 2. Добавляем разрешённые языки к шаблонам тестов
    // ========================================================================
    await connection.execute(`
        ALTER TABLE test_templates 
        ADD COLUMN allowed_languages JSON DEFAULT NULL 
        COMMENT 'Разрешённые языки тестирования: ["ru", "uz", "en"]. NULL = все языки'
        AFTER proctoring_settings
    `);
    console.log('  ✅ Added column: test_templates.allowed_languages');

    // ========================================================================
    // 3. Добавляем выбранный язык к сессиям тестов
    // ========================================================================

    // Проверяем, есть ли колонка is_preview (добавлена в предыдущей миграции)
    // Если есть - добавляем AFTER is_preview, иначе AFTER violations
    try {
        await connection.execute(`
            ALTER TABLE test_sessions 
            ADD COLUMN language ENUM('en', 'ru', 'uz') DEFAULT NULL 
            COMMENT 'Выбранный язык тестирования (фиксируется при старте)'
            AFTER preview_user_id
        `);
    } catch {
        // Если preview_user_id не существует, пробуем после violations
        await connection.execute(`
            ALTER TABLE test_sessions 
            ADD COLUMN language ENUM('en', 'ru', 'uz') DEFAULT NULL 
            COMMENT 'Выбранный язык тестирования (фиксируется при старте)'
            AFTER violations
        `);
    }
    console.log('  ✅ Added column: test_sessions.language');

    // Индекс для статистики по языкам
    await connection.execute(`
        CREATE INDEX idx_test_sessions_language ON test_sessions(language)
    `);
    console.log('  ✅ Added index: idx_test_sessions_language');

    console.log('✅ Migration 20260105_032_multilang_questions completed');
}

export async function down(connection: PoolConnection): Promise<void> {
    console.log('🔄 Rolling back migration: 20260105_032_multilang_questions');

    // ========================================================================
    // 1. Удаляем колонку language из test_sessions
    // ========================================================================
    await connection.execute(`
        DROP INDEX idx_test_sessions_language ON test_sessions
    `);
    console.log('  ✅ Dropped index: idx_test_sessions_language');

    await connection.execute(`
        ALTER TABLE test_sessions DROP COLUMN language
    `);
    console.log('  ✅ Dropped column: test_sessions.language');

    // ========================================================================
    // 2. Удаляем колонку allowed_languages из test_templates
    // ========================================================================
    await connection.execute(`
        ALTER TABLE test_templates DROP COLUMN allowed_languages
    `);
    console.log('  ✅ Dropped column: test_templates.allowed_languages');

    // ========================================================================
    // 3. Удаляем колонку language из questions
    // ========================================================================
    await connection.execute(`
        DROP INDEX idx_questions_bank_language ON questions
    `);
    console.log('  ✅ Dropped index: idx_questions_bank_language');

    await connection.execute(`
        DROP INDEX idx_questions_language ON questions
    `);
    console.log('  ✅ Dropped index: idx_questions_language');

    await connection.execute(`
        ALTER TABLE questions DROP COLUMN language
    `);
    console.log('  ✅ Dropped column: questions.language');

    console.log('✅ Rollback 20260105_032_multilang_questions completed');
}
