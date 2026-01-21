/**
 * Утилита для получения настройки длительности академического часа
 */

import { executeQuery } from "../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface SettingRow extends RowDataPacket {
  setting_value: string;
}

// Кэш для настройки (чтобы не делать запрос к БД каждый раз)
let cachedAcademicHourMinutes: number | null = null;

/**
 * Получить длительность академического часа в минутах из настроек
 * @returns Длительность академического часа в минутах (по умолчанию 40)
 */
export async function getAcademicHourMinutes(): Promise<number> {
  // Возвращаем из кэша, если уже загружено
  if (cachedAcademicHourMinutes !== null) {
    return cachedAcademicHourMinutes;
  }

  try {
    const rows = await executeQuery<SettingRow[]>(
      "SELECT setting_value FROM schedule_settings WHERE setting_key = 'academic_hour_minutes' LIMIT 1",
    );

    if (rows.length > 0 && rows[0]) {
      const value = parseInt(rows[0].setting_value, 10);
      cachedAcademicHourMinutes = isNaN(value) ? 40 : value;
    } else {
      cachedAcademicHourMinutes = 40; // Значение по умолчанию
    }
  } catch (error) {
    console.warn(
      "[getAcademicHourMinutes] Ошибка получения настройки, используется значение по умолчанию:",
      error,
    );
    cachedAcademicHourMinutes = 40;
  }

  return cachedAcademicHourMinutes;
}

/**
 * Сбросить кэш настройки (вызывать после изменения настроек)
 */
export function resetAcademicHourCache(): void {
  cachedAcademicHourMinutes = null;
}
