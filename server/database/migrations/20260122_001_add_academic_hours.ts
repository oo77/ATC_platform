/**
 * Миграция: Добавление поля academic_hours в schedule_events
 * Хранит количество академических часов занятия напрямую, без расчётов
 */

import type { PoolConnection } from "mysql2/promise";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("Добавление поля academic_hours в schedule_events...");

  // Добавляем поле academic_hours
  await connection.execute(`
    ALTER TABLE schedule_events 
    ADD COLUMN academic_hours INT NULL COMMENT 'Количество академических часов занятия'
  `);

  console.log("✓ Поле academic_hours добавлено");

  // Заполняем из duration_minutes для существующих записей (если есть)
  // 1 а-ч = period_duration_minutes (из настроек, по умолчанию 40 минут)
  // Округляем вверх для безопасности
  console.log("Заполнение academic_hours для существующих записей...");

  await connection.execute(`
    UPDATE schedule_events 
    SET academic_hours = CEIL(COALESCE(duration_minutes, TIMESTAMPDIFF(MINUTE, start_time, end_time)) / 40)
    WHERE academic_hours IS NULL AND duration_minutes IS NOT NULL
  `);

  console.log("✓ Существующие записи обновлены");
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("Удаление поля academic_hours из schedule_events...");

  await connection.execute(`
    ALTER TABLE schedule_events 
    DROP COLUMN academic_hours
  `);

  console.log("✓ Поле academic_hours удалено");
}
