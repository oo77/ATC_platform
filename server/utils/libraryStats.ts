/**
 * Общие запросы аналитики библиотеки.
 */
import { executeQuery } from "./db";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  sessions: number;
  readers: number;
  seconds: number;
}

/** Период в днях из query: 7 / 30 / 90 / 365 */
export function parsePeriodDays(value: unknown): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  return [7, 30, 90, 365].includes(n) ? n : 30;
}

/**
 * Ряд по дням за последние `days` дней, без пропусков.
 * Даты считаются на стороне MySQL, чтобы не расходиться с часовым поясом БД.
 */
export async function dailySeries(days: number, bookId?: string): Promise<DailyPoint[]> {
  const [startRow] = await executeQuery<any[]>(
    `SELECT DATE_FORMAT(CURDATE() - INTERVAL ? DAY, '%Y-%m-%d') AS start`,
    [days - 1],
  );
  const rows = await executeQuery<any[]>(
    `SELECT DATE_FORMAT(s.started_at, '%Y-%m-%d') AS d,
            COUNT(*) AS sessions,
            COUNT(DISTINCT s.user_id) AS readers,
            COALESCE(SUM(s.active_seconds), 0) AS seconds
     FROM book_reading_sessions s
     WHERE s.started_at >= CURDATE() - INTERVAL ? DAY
       ${bookId ? "AND s.book_id = ?" : ""}
     GROUP BY d`,
    bookId ? [days - 1, bookId] : [days - 1],
  );
  const byDate = new Map(rows.map((r) => [r.d, r]));

  const points: DailyPoint[] = [];
  const [y = 1970, m = 1, d = 1] = String(startRow?.start || "").split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  for (let i = 0; i < days; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const r = byDate.get(key);
    points.push({
      date: key,
      sessions: Number(r?.sessions || 0),
      readers: Number(r?.readers || 0),
      seconds: Number(r?.seconds || 0),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

/** SQL «читатель дочитал книгу» для алиасов progress / books */
export const COMPLETED_SQL = (p = "p", b = "b") =>
  `(${p}.completed_at IS NOT NULL OR (${b}.total_pages > 0 AND ${p}.max_page >= ${b}.total_pages))`;
