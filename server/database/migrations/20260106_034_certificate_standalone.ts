import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Поддержка standalone сертификатов (импорт и ручное добавление)
 * Дата: 2026-01-06
 * Описание:
 * - Делает group_id и template_id опциональными
 * - Добавляет поля для хранения данных курса/группы непосредственно в записи
 * - Добавляет source_type для отслеживания источника создания сертификата
 * 
 * Логика заполнения:
 * - source_type = 'group_journal': данные берутся из связей (group_id → course, template_id)
 * - source_type = 'manual' | 'import': данные хранятся в полях course_name, course_code и т.д.
 */

export const up = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Running migration: certificate_standalone');

    // 1. Удаляем уникальный индекс student_id + group_id (он мешает standalone сертификатам)
    try {
        await connection.query(`
      ALTER TABLE issued_certificates 
      DROP INDEX idx_student_group
    `);
        console.log('✅ Dropped unique index idx_student_group');
    } catch (error: any) {
        // Индекс может не существовать
        if (!error.message?.includes('check that it exists')) {
            console.log('ℹ️  Index idx_student_group already removed or does not exist');
        }
    }

    // 2. Удаляем внешние ключи для group_id и template_id
    try {
        await connection.query(`
      ALTER TABLE issued_certificates 
      DROP FOREIGN KEY fk_issued_cert_group
    `);
        console.log('✅ Dropped foreign key fk_issued_cert_group');
    } catch (error: any) {
        console.log('ℹ️  Foreign key fk_issued_cert_group already removed or does not exist');
    }

    try {
        await connection.query(`
      ALTER TABLE issued_certificates 
      DROP FOREIGN KEY fk_issued_cert_template
    `);
        console.log('✅ Dropped foreign key fk_issued_cert_template');
    } catch (error: any) {
        console.log('ℹ️  Foreign key fk_issued_cert_template already removed or does not exist');
    }

    // 3. Делаем group_id и template_id опциональными
    await connection.query(`
    ALTER TABLE issued_certificates 
    MODIFY COLUMN group_id VARCHAR(191) NULL COMMENT 'ID группы (для сертификатов из журнала)',
    MODIFY COLUMN template_id VARCHAR(191) NULL COMMENT 'ID шаблона (для сертификатов из журнала)'
  `);
    console.log('✅ Made group_id and template_id optional');

    // 4. Добавляем поля для standalone сертификатов
    await connection.query(`
    ALTER TABLE issued_certificates 
    ADD COLUMN course_name VARCHAR(255) NULL 
      COMMENT 'Название курса (для standalone сертификатов)' AFTER template_id,
    ADD COLUMN course_code VARCHAR(50) NULL 
      COMMENT 'Код курса' AFTER course_name,
    ADD COLUMN course_hours INT NULL 
      COMMENT 'Количество часов курса' AFTER course_code,
    ADD COLUMN group_code VARCHAR(50) NULL 
      COMMENT 'Код группы (текст)' AFTER course_hours,
    ADD COLUMN group_start_date DATE NULL 
      COMMENT 'Дата начала обучения' AFTER group_code,
    ADD COLUMN group_end_date DATE NULL 
      COMMENT 'Дата окончания обучения' AFTER group_start_date,
    ADD COLUMN source_type ENUM('group_journal', 'manual', 'import') 
      NOT NULL DEFAULT 'group_journal' 
      COMMENT 'Источник создания сертификата' AFTER group_end_date
  `);
    console.log('✅ Added standalone fields and source_type');

    // 5. Создаём индекс для source_type
    await connection.query(`
    ALTER TABLE issued_certificates 
    ADD INDEX idx_source_type (source_type)
  `);
    console.log('✅ Added index for source_type');

    // 6. Создаём составной индекс для student_id + source_type
    await connection.query(`
    ALTER TABLE issued_certificates 
    ADD INDEX idx_student_source (student_id, source_type)
  `);
    console.log('✅ Added composite index for student_id + source_type');

    // 7. Обновляем существующие записи (все они из журнала групп)
    const [updateResult] = await connection.query(`
    UPDATE issued_certificates 
    SET source_type = 'group_journal' 
    WHERE group_id IS NOT NULL AND template_id IS NOT NULL
  `);
    console.log(`✅ Updated existing certificates to source_type = 'group_journal'`, updateResult);

    // 8. Восстанавливаем внешние ключи (но теперь для NULL-значений проверка не выполняется)
    try {
        await connection.query(`
      ALTER TABLE issued_certificates 
      ADD CONSTRAINT fk_issued_cert_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
        console.log('✅ Re-added foreign key fk_issued_cert_group (with SET NULL on delete)');
    } catch (error: any) {
        console.log('⚠️  Could not add foreign key fk_issued_cert_group:', error.message);
    }

    try {
        await connection.query(`
      ALTER TABLE issued_certificates 
      ADD CONSTRAINT fk_issued_cert_template 
        FOREIGN KEY (template_id) REFERENCES certificate_templates(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
        console.log('✅ Re-added foreign key fk_issued_cert_template (with SET NULL on delete)');
    } catch (error: any) {
        console.log('⚠️  Could not add foreign key fk_issued_cert_template:', error.message);
    }

    console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
    console.log('🔄 Rolling back migration: certificate_standalone');

    // 1. Удаляем индексы
    try {
        await connection.query(`ALTER TABLE issued_certificates DROP INDEX idx_source_type`);
    } catch { /* ignore */ }

    try {
        await connection.query(`ALTER TABLE issued_certificates DROP INDEX idx_student_source`);
    } catch { /* ignore */ }

    // 2. Удаляем новые колонки
    await connection.query(`
    ALTER TABLE issued_certificates 
    DROP COLUMN IF EXISTS course_name,
    DROP COLUMN IF EXISTS course_code,
    DROP COLUMN IF EXISTS course_hours,
    DROP COLUMN IF EXISTS group_code,
    DROP COLUMN IF EXISTS group_start_date,
    DROP COLUMN IF EXISTS group_end_date,
    DROP COLUMN IF EXISTS source_type
  `);
    console.log('✅ Removed standalone fields');

    // 3. Возвращаем NOT NULL для group_id и template_id 
    // (Внимание: это может не сработать, если есть записи с NULL)
    console.log('⚠️  Cannot fully restore NOT NULL constraints without data loss');

    // 4. Восстанавливаем уникальный индекс
    try {
        await connection.query(`
      ALTER TABLE issued_certificates 
      ADD UNIQUE INDEX idx_student_group (student_id, group_id)
    `);
        console.log('✅ Restored unique index idx_student_group');
    } catch (error: any) {
        console.log('⚠️  Could not restore unique index idx_student_group:', error.message);
    }

    console.log('✅ Rollback completed');
};

export const description = 'Поддержка standalone сертификатов (импорт и ручное добавление)';
