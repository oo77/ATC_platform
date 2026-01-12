/**
 * Миграция 040: Заполнение пропущенных статусов отметки посещаемости
 * Создаёт записи в attendance_marking_status для существующих занятий
 */

import type { PoolConnection } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export const description = 'Backfill missing attendance marking statuses';

export async function up(connection: PoolConnection): Promise<void> {
  console.log('START: Backfilling attendance marking statuses...');

  // 1. Получаем настройки (или дефолты)
  const [settingsRows] = await connection.query<any[]>('SELECT * FROM attendance_settings');
  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[row.setting_key] = row.setting_value;
  }
  const deadlineHours = parseInt(settings['ATTENDANCE_MARK_DEADLINE_HOURS'] || '24', 10);
  const lateDeadlineHours = parseInt(settings['ATTENDANCE_EDIT_DEADLINE_HOURS'] || '72', 10);

  // 2. Ищем занятия без статуса
  const [events] = await connection.query<any[]>(`
    SELECT 
      se.id, 
      se.start_time, 
      se.end_time, 
      se.group_id,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = se.group_id) as students_count,
      (SELECT COUNT(*) FROM attendance a WHERE a.schedule_event_id = se.id) as marked_count
    FROM schedule_events se
    LEFT JOIN attendance_marking_status ams ON se.id = ams.schedule_event_id
    WHERE ams.id IS NULL
      AND se.group_id IS NOT NULL
  `);

  console.log(`Found ${events.length} events needing marking status backfill.`);

  if (events.length === 0) {
    console.log('✅ No events to backfill.');
    return;
  }

  // 3. Формируем значения для вставки
  const now = new Date();
  let values: any[] = [];
  const placeholders: string[] = [];

  for (const event of events) {
    const id = uuidv4();
    const endTime = new Date(event.end_time);
    const deadline = new Date(endTime.getTime() + deadlineHours * 60 * 60 * 1000);
    const lateDeadline = new Date(endTime.getTime() + lateDeadlineHours * 60 * 60 * 1000);
    
    let status = 'pending';
    const studentsCount = event.students_count || 0;
    const markedCount = event.marked_count || 0;

    // Логика определения статуса
    if (markedCount > 0) {
      // Если есть отметки - считаем, что всё ок (или опоздание, если бы было поле marked_at, но его нет для старых)
      // Для упрощения ставим on_time для уже отмеченных
      status = 'on_time';
    } else {
      // Нет отметок. Проверяем дедлайны
      if (now > lateDeadline) {
        status = 'overdue';
      } else if (now > deadline) {
        status = 'late';
      } else if (now >= new Date(event.start_time)) {
        status = 'pending'; // Занятие началось или закончилось недавно
      } else {
        status = 'pending'; // Будущее
      }
    }

    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
    values.push(
      id,
      event.id,
      status, 
      status === 'on_time' ? null : null, // marked_by unknown for history
      deadline,
      lateDeadline,
      studentsCount,
      markedCount
    );

    // Вставляем пачками по 500
    if (placeholders.length >= 500) {
      await connection.query(
        `INSERT INTO attendance_marking_status 
         (id, schedule_event_id, status, marked_by, deadline, late_deadline, students_count, marked_count)
         VALUES ${placeholders.join(', ')}`,
        values
      );
      placeholders.length = 0;
      values = [];
    }
  }

  // Оставшиеся
  if (placeholders.length > 0) {
    await connection.query(
      `INSERT INTO attendance_marking_status 
       (id, schedule_event_id, status, marked_by, deadline, late_deadline, students_count, marked_count)
       VALUES ${placeholders.join(', ')}`,
      values
    );
  }

  console.log('✅ Backfill completed successfully.');
}

export async function down(connection: PoolConnection): Promise<void> {
  // Не удаляем бэкфилл, это данные.
  console.log('No action for down migration of backfill.');
}
