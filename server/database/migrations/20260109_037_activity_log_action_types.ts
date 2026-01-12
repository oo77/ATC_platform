/**
 * Миграция: Расширение action_type ENUM для activity_logs
 * 
 * Добавляет значения: APPROVE, REJECT, BLOCK, UNBLOCK, REVOKE, ISSUE, RESET_PASSWORD, ASSIGN, UNASSIGN
 */

import { executeQuery } from '../../utils/db';

export const migrationId = '20260109_037_activity_log_action_types';
export const description = 'Expand action_type ENUM with RESET_PASSWORD, APPROVE, REJECT, BLOCK, UNBLOCK, REVOKE, ISSUE, ASSIGN, UNASSIGN';

export async function up(): Promise<void> {
  console.log('[Migration] Расширение ENUM action_type (добавление новых типов действий)...');

  // Изменяем action_type ENUM, добавляя все типы действий
  await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM(
      'CREATE', 
      'UPDATE', 
      'DELETE', 
      'VIEW', 
      'LOGIN', 
      'LOGOUT', 
      'IMPORT', 
      'EXPORT',
      'APPROVE',
      'REJECT',
      'BLOCK',
      'UNBLOCK',
      'REVOKE',
      'ISSUE',
      'RESET_PASSWORD',
      'ASSIGN',
      'UNASSIGN'
    ) NOT NULL
  `);

  console.log('[Migration] ✅ action_type ENUM обновлён с новыми типами действий');
}

export async function down(): Promise<void> {
  console.log('[Migration] Откат: удаление новых типов действий из ENUM...');

  // Удаляем записи с новыми значениями перед изменением ENUM
  await executeQuery(`
    DELETE FROM activity_logs WHERE action_type IN (
      'APPROVE', 'REJECT', 'BLOCK', 'UNBLOCK', 
      'REVOKE', 'ISSUE', 'RESET_PASSWORD', 'ASSIGN', 'UNASSIGN'
    )
  `);

  // Возвращаем action_type ENUM к предыдущему состоянию
  await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT') NOT NULL
  `);

  console.log('[Migration] ✅ action_type ENUM откачен к предыдущему состоянию');
}
