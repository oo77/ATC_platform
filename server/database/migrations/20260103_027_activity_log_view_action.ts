/**
 * Миграция: Расширение ENUM action_type и entity_type для activity_logs
 * 
 * Проблема: В TypeScript типах ActionType и EntityType содержат больше значений, 
 * чем было определено в базе данных, что вызывало ошибку "Data truncated for column"
 */

import { executeQuery } from '../../utils/db';

export const migrationId = '20260103_027_activity_log_enum_expansion';
export const description = 'Expand activity_logs ENUM columns (action_type, entity_type)';

export async function up(): Promise<void> {
    console.log('[Migration] Расширение ENUM action_type (добавление VIEW)...');

    // Изменяем action_type ENUM, добавляя 'VIEW'
    await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT') NOT NULL
  `);

    console.log('[Migration] ✅ action_type ENUM обновлён');

    console.log('[Migration] Расширение ENUM entity_type...');

    // Изменяем entity_type ENUM, добавляя все недостающие типы
    await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM(
      'USER', 
      'STUDENT', 
      'CERTIFICATE', 
      'CERTIFICATE_TEMPLATE',
      'ISSUED_CERTIFICATE',
      'COURSE', 
      'DISCIPLINE', 
      'INSTRUCTOR', 
      'FILE', 
      'FOLDER', 
      'SCHEDULE',
      'GROUP',
      'CLASSROOM',
      'ORGANIZATION',
      'REPRESENTATIVE',
      'ATTENDANCE',
      'GRADE',
      'SYSTEM'
    ) NOT NULL
  `);

    console.log('[Migration] ✅ entity_type ENUM обновлён');
}

export async function down(): Promise<void> {
    console.log('[Migration] Откат: сужение ENUM...');

    // Удаляем записи с новыми значениями перед изменением ENUM
    await executeQuery(`
    DELETE FROM activity_logs WHERE action_type = 'VIEW'
  `);

    await executeQuery(`
    DELETE FROM activity_logs WHERE entity_type IN (
      'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE', 'SCHEDULE', 
      'GROUP', 'CLASSROOM', 'ORGANIZATION', 'REPRESENTATIVE', 
      'ATTENDANCE', 'GRADE'
    )
  `);

    // Возвращаем action_type ENUM к исходному состоянию
    await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT') NOT NULL
  `);

    // Возвращаем entity_type ENUM к исходному состоянию
    await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM('USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM') NOT NULL
  `);

    console.log('[Migration] ✅ ENUM откачены к исходному состоянию');
}
