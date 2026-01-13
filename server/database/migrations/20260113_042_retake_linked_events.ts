import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Связанные пересдачи (Linked Retake Events)
 * Дата: 2026-01-13
 * Описание: Добавление поля original_event_id в таблицу schedule_events
 *           для связывания пересдач с оригинальными занятиями.
 *           Это позволяет корректно рассчитывать среднюю оценку,
 *           используя только последнюю оценку для связанных событий.
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20260113_042_retake_linked_events");

  // 1. Добавляем поле original_event_id для связи с оригинальным занятием
  await connection.query(`
    ALTER TABLE schedule_events 
    ADD COLUMN original_event_id VARCHAR(191) NULL 
    COMMENT 'ID оригинального события (если это пересдача)'
  `);
  console.log("  ✅ Added column: original_event_id to schedule_events");

  // 2. Создаём внешний ключ
  await connection.query(`
    ALTER TABLE schedule_events
    ADD CONSTRAINT fk_schedule_original_event 
    FOREIGN KEY (original_event_id) REFERENCES schedule_events(id) 
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("  ✅ Added foreign key: fk_schedule_original_event");

  // 3. Создаём индекс для быстрого поиска пересдач
  await connection.query(`
    CREATE INDEX idx_original_event_id ON schedule_events(original_event_id)
  `);
  console.log("  ✅ Added index: idx_original_event_id");

  console.log(
    "✅ Migration 20260113_042_retake_linked_events completed successfully"
  );
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20260113_042_retake_linked_events");

  // Удаляем внешний ключ
  await connection.query(`
    ALTER TABLE schedule_events 
    DROP FOREIGN KEY fk_schedule_original_event
  `);
  console.log("  ✅ Dropped foreign key: fk_schedule_original_event");

  // Удаляем индекс
  await connection.query(`
    DROP INDEX idx_original_event_id ON schedule_events
  `);
  console.log("  ✅ Dropped index: idx_original_event_id");

  // Удаляем колонку
  await connection.query(`
    ALTER TABLE schedule_events 
    DROP COLUMN original_event_id
  `);
  console.log("  ✅ Dropped column: original_event_id");

  console.log(
    "✅ Rollback 20260113_042_retake_linked_events completed successfully"
  );
};

export const description =
  "Добавление связи пересдач с оригинальными занятиями (original_event_id)";
