import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: академические часы 11–14 (7 пар в день)
 * Дата: 2026-11-12
 *
 * До миграции в schedule_periods было 10 академических часов (5 пар, до 16:50).
 * Добавляются ещё 4 часа (2 пары), перерыв между парами 10 минут, без большого перерыва:
 *   11: 17:00–17:40   12: 17:40–18:20
 *   13: 18:30–19:10   14: 19:10–19:50
 *
 * Если часы с такими номерами уже есть — время у них не трогается
 * (могли быть настроены вручную в «Настройках расписания»), только включаются.
 */

export const description =
  "Расписание: академические часы 11–14 (7 пар, до 19:50)";

const NEW_PERIODS: Array<[number, string, string]> = [
  [11, "17:00", "17:40"],
  [12, "17:40", "18:20"],
  [13, "18:30", "19:10"],
  [14, "19:10", "19:50"],
];

export const up = async (connection: PoolConnection): Promise<void> => {
  for (const [num, start, end] of NEW_PERIODS) {
    const [rows] = await connection.query<any[]>(
      "SELECT id FROM schedule_periods WHERE period_number = ? LIMIT 1",
      [num],
    );
    if (rows.length > 0) {
      await connection.query(
        "UPDATE schedule_periods SET is_active = TRUE WHERE period_number = ?",
        [num],
      );
    } else {
      await connection.query(
        `INSERT INTO schedule_periods (period_number, start_time, end_time, is_after_break, is_active)
         VALUES (?, ?, ?, FALSE, TRUE)`,
        [num, start, end],
      );
    }
  }
  console.log("✅ Академические часы 11–14 добавлены (7 пар, до 19:50)");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  await connection.query(
    "DELETE FROM schedule_periods WHERE period_number IN (11, 12, 13, 14)",
  );
  console.log("✅ Академические часы 11–14 удалены");
};
