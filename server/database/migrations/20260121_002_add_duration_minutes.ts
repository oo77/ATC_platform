/**
 * Миграция: Добавление поля duration_minutes в schedule_events
 * Дата: 2026-01-21
 */

import type { Connection } from "mysql2/promise";

export const up = async (connection: Connection): Promise<void> => {
  console.log("Добавление поля duration_minutes в schedule_events...");

  // Добавляем поле duration_minutes
  await connection.query(`
    ALTER TABLE schedule_events
    ADD COLUMN duration_minutes INT NULL COMMENT 'Чистая длительность занятия в минутах (без перерывов)'
    AFTER end_time
  `);

  console.log("✓ Поле duration_minutes добавлено");

  // Заполняем существующие записи
  console.log("Заполнение duration_minutes для существующих записей...");

  await connection.query(`
    UPDATE schedule_events
    SET duration_minutes = TIMESTAMPDIFF(MINUTE, start_time, end_time)
    WHERE duration_minutes IS NULL
  `);

  console.log("✓ Существующие записи обновлены");
};

export const down = async (connection: Connection): Promise<void> => {
  console.log("Удаление поля duration_minutes из schedule_events...");

  await connection.query(`
    ALTER TABLE schedule_events
    DROP COLUMN duration_minutes
  `);

  console.log("✓ Поле duration_minutes удалено");
};
