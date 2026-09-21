/**
 * Цвета учебных групп в расписании.
 *
 * Модуль общий для клиента (календарь /schedule) и сервера (выгрузка в Excel),
 * поэтому не имеет зависимостей: цвет группы в календаре и в Excel — один и тот же.
 *
 * Принцип назначения цвета:
 *  - сервер присваивает группе `colorIndex` = порядковый номер группы по дате создания
 *    (по модулю размера палитры). Одновременно идущие группы создаются рядом по времени,
 *    поэтому получают разные цвета, а цвет группы не «прыгает» при смене недели/фильтров;
 *  - если `colorIndex` не передан (старые ответы API), используется хеш от id группы.
 *
 * Палитра упорядочена так, что соседние индексы имеют заметно разный оттенок.
 */

export const GROUP_COLOR_PALETTE: readonly string[] = [
  "#2563EB", // синий
  "#EA580C", // оранжевый
  "#059669", // изумрудный
  "#DB2777", // розовый
  "#7C3AED", // фиолетовый
  "#0891B2", // циан
  "#CA8A04", // горчичный
  "#DC2626", // красный
  "#4F46E5", // индиго
  "#65A30D", // лаймовый
  "#C026D3", // фуксия
  "#0D9488", // бирюзовый
  "#0284C7", // небесный
  "#B45309", // янтарный
  "#16A34A", // зелёный
  "#9333EA", // пурпурный
  "#E11D48", // малиновый
  "#475569", // сланцевый
  "#1D4ED8", // тёмно-синий
  "#C2410C", // терракотовый
  "#047857", // хвойный
  "#BE185D", // тёмно-розовый
  "#6D28D9", // тёмно-фиолетовый
  "#155E75", // морской
];

/** Нейтральный цвет для занятий без группы */
export const NO_GROUP_COLOR = "#64748B";

/** Цвета фона в тёмной теме (совпадают с фоном карточек боксов админки) */
const DARK_SURFACE = "#1C2434";

// ---------------------------------------------------------------------------
// Базовые операции с цветом
// ---------------------------------------------------------------------------

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
}

/** Смешивает два цвета: t=0 → a, t=1 → b */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Относительная яркость по WCAG (0…1) */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Цвет текста (белый/тёмный), читаемый на заливке `bgHex` */
export function readableTextOn(bgHex: string): "#FFFFFF" | "#111827" {
  // Порог подобран так, чтобы на «горчичном» (#CA8A04) текст был тёмным
  return relativeLuminance(bgHex) > 0.3 ? "#111827" : "#FFFFFF";
}

// ---------------------------------------------------------------------------
// Цвет группы
// ---------------------------------------------------------------------------

/** Детерминированный индекс палитры по строке (запасной вариант) */
export function hashToPaletteIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % GROUP_COLOR_PALETTE.length;
}

/**
 * Базовый цвет группы.
 * @param groupId    id группы (null — занятие без группы)
 * @param colorIndex индекс, назначенный сервером (предпочтительнее хеша)
 */
export function resolveGroupColor(
  groupId: string | null | undefined,
  colorIndex?: number | null,
): string {
  if (!groupId) return NO_GROUP_COLOR;
  const size = GROUP_COLOR_PALETTE.length;
  const idx =
    typeof colorIndex === "number" && colorIndex >= 0
      ? colorIndex % size
      : hashToPaletteIndex(groupId);
  return GROUP_COLOR_PALETTE[idx] ?? NO_GROUP_COLOR;
}

/** Набор производных цветов для оформления карточки занятия */
export interface GroupColorTokens {
  /** Основной цвет группы (акцентная полоса, точка, заливка в Excel) */
  base: string;
  /** Мягкая заливка карточки в светлой теме */
  soft: string;
  /** Мягкая заливка карточки в тёмной теме */
  softDark: string;
  /** Тёмный оттенок для текста на мягкой заливке (светлая тема) */
  ink: string;
  /** Светлый оттенок для текста на мягкой заливке (тёмная тема) */
  inkDark: string;
  /** Цвет текста на заливке base (для Excel и «плотных» плашек) */
  onBase: string;
}

export function deriveGroupColorTokens(base: string): GroupColorTokens {
  return {
    base,
    soft: mixHex(base, "#FFFFFF", 0.86),
    softDark: mixHex(base, DARK_SURFACE, 0.72),
    ink: mixHex(base, "#000000", 0.4),
    inkDark: mixHex(base, "#FFFFFF", 0.6),
    onBase: readableTextOn(base),
  };
}
