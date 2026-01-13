import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Разрешенные студенты для событий
 * Дата: 2026-01-13
 * Описание: Добавление поля allowed_student_ids в таблицу schedule_events и миграция данных
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Running migration: 20260113_043_schedule_events_allowed_students"
  );

  // Добавляем колонку allowed_student_ids в таблицу schedule_events
  await connection.query(`
    ALTER TABLE schedule_events
    ADD COLUMN allowed_student_ids JSON NULL COMMENT 'Список ID студентов, допущенных к занятию (для пересдач)';
  `);
  console.log("  ✅ Added column: allowed_student_ids to schedule_events");

  // Миграция данных: копируем allowed_student_ids из test_assignments в schedule_events
  const [result] = await connection.query(`
    UPDATE schedule_events se
    JOIN test_assignments ta ON se.id = ta.schedule_event_id
    SET se.allowed_student_ids = ta.allowed_student_ids
    WHERE ta.allowed_student_ids IS NOT NULL
  `);

  // @ts-ignore - result might not have affectedRows depending on types, but usually it does in mysql2
  console.log(`  ✅ Migrated data for ${result.affectedRows || 0} events`);

  console.log(
    "✅ Migration 20260113_043_schedule_events_allowed_students completed successfully"
  );
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Rolling back migration: 20260113_043_schedule_events_allowed_students"
  );

  await connection.query(`
    ALTER TABLE schedule_events
    DROP COLUMN allowed_student_ids;
  `);

  console.log(
    "✅ Rollback 20260113_043_schedule_events_allowed_students completed successfully"
  );
};

export const description =
  "Добавление разрешенных студентов для событий (allowed_student_ids)";
