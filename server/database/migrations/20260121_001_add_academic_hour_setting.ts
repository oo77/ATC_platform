/**
 * Миграция: Добавление настройки длительности академического часа
 * Дата: 2026-01-21
 */

import type { Connection } from "mysql2/promise";

export const up = async (connection: Connection): Promise<void> => {
  console.log("Добавление настройки academic_hour_minutes...");

  // Проверяем, существует ли уже эта настройка
  const [existing] = await connection.query(
    "SELECT COUNT(*) as count FROM schedule_settings WHERE setting_key = 'academic_hour_minutes'",
  );

  const count = (existing as any)[0]?.count || 0;

  if (count === 0) {
    // Добавляем настройку длительности академического часа (по умолчанию 40 минут)
    await connection.query(
      `INSERT INTO schedule_settings (setting_key, setting_value, description)
       VALUES ('academic_hour_minutes', '40', 'Длительность одного академического часа в минутах (для расчета учебных часов)')
       ON DUPLICATE KEY UPDATE setting_value = setting_value`,
    );
    console.log("✓ Настройка academic_hour_minutes добавлена");
  } else {
    console.log("✓ Настройка academic_hour_minutes уже существует");
  }
};

export const down = async (connection: Connection): Promise<void> => {
  console.log("Удаление настройки academic_hour_minutes...");

  await connection.query(
    "DELETE FROM schedule_settings WHERE setting_key = 'academic_hour_minutes'",
  );

  console.log("✓ Настройка academic_hour_minutes удалена");
};
