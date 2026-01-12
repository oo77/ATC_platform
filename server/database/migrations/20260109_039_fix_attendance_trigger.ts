/**
 * Миграция 039: Исправление триггера системы отметок
 * Исправляет имя таблицы group_students -> study_group_students в триггере
 */

import type { PoolConnection } from 'mysql2/promise';

export const description = 'Исправление триггера trg_schedule_event_after_insert';

export async function up(connection: PoolConnection): Promise<void> {
  console.log('  Fixing attendance marking trigger...');
  
  // Пересоздаём триггер с правильным именем таблицы
  try {
    await connection.query(`DROP TRIGGER IF EXISTS trg_schedule_event_after_insert`);
    await connection.query(`
      CREATE TRIGGER trg_schedule_event_after_insert
      AFTER INSERT ON schedule_events
      FOR EACH ROW
      BEGIN
        DECLARE deadline_hours INT DEFAULT 24;
        DECLARE late_deadline_hours INT DEFAULT 72;
        DECLARE students_cnt INT DEFAULT 0;
        
        -- Получаем настройки
        SELECT CAST(setting_value AS UNSIGNED) INTO deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_MARK_DEADLINE_HOURS';
        
        SELECT CAST(setting_value AS UNSIGNED) INTO late_deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_EDIT_DEADLINE_HOURS';
        
        -- Подсчитываем студентов в группе (ИСПРАВЛЕНО ИМЯ ТАБЛИЦЫ)
        IF NEW.group_id IS NOT NULL THEN
          SELECT COUNT(*) INTO students_cnt 
          FROM study_group_students WHERE group_id = NEW.group_id;
        END IF;
        
        -- Создаём запись статуса
        INSERT INTO attendance_marking_status (
          id, 
          schedule_event_id, 
          status, 
          deadline, 
          late_deadline,
          students_count
        ) VALUES (
          UUID(),
          NEW.id,
          'pending',
          DATE_ADD(NEW.end_time, INTERVAL deadline_hours HOUR),
          DATE_ADD(NEW.end_time, INTERVAL late_deadline_hours HOUR),
          students_cnt
        );
      END
    `);
    console.log('  ✅ Trigger updated successfully');
  } catch (error: any) {
    console.log('  ❌ Error updating trigger:', error.message);
    throw error;
  }
}

export async function down(connection: PoolConnection): Promise<void> {
  // Нет необходимости откатывать исправление на ошибочную версию
  console.log('  No action for down migration of trigger fix');
}
