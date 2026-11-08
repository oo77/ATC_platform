/**
 * Общие помощники для расчёта данных публичных дашбордов
 */

export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const int = (v: unknown, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round(num(v))));

/** «Иванов Иван Иванович» → «Иванов И. И.» */
export function maskName(full: string | null | undefined): string {
  if (!full) return "—";
  const parts = String(full).trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "—";
  return [parts[0], ...parts.slice(1, 3).map((p) => `${p.charAt(0).toUpperCase()}.`)].join(" ");
}

const DAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_GEN = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** YYYY-MM-DD → { label: "Пн", date: "10 ноя" } (без часовых поясов) */
export function dayLabel(ymd: string): { weekday: string; date: string } {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const wd = (dt.getUTCDay() + 6) % 7;
  return { weekday: DAY_SHORT[wd]!, date: `${d} ${MONTH_GEN[m! - 1]}` };
}

/** YYYY-MM-DD + n дней */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + n));
  return dt.toISOString().slice(0, 10);
}
