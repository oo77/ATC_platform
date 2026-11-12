/**
 * Excel-отчёт «Расписание занятий и экзаменов на неделю».
 *
 * Форма повторяет печатную форму учебного центра:
 *  - справа сверху блок «УТВЕРЖДАЮ», ниже — заголовок с периодом;
 *  - строки: дни недели (Пн, Вт, …) → академические часы (по 2 часа в паре);
 *  - слева один раз «День недели | Дата», дальше — места проведения (аудитории).
 *    В каждом месте проведения свои колонки «Пара | Ак. час | Время» (время считается
 *    отдельно для каждой аудитории и дня) и затем блоки по 5 колонок
 *    «Группа | Дисциплина | Вид | Инструктор»; после ФИО инструктора через пробел — число слушателей.
 *    Блоков в аудитории столько, сколько групп занимается в ней одновременно;
 *  - ячейка «Группа» залита цветом группы (тем же, что в календаре расписания);
 *  - печать: A3, альбомная, на одну страницу.
 *
 * Модуль не обращается к БД: всё, что нужно, передаётся в `buildScheduleWorkbook`.
 */

import ExcelJS from "exceljs";
import type { ScheduleEvent } from "../repositories/scheduleRepository";
import { resolveGroupColor, readableTextOn } from "../../shared/utils/groupColors";
import { eventKindShort } from "../../shared/utils/scheduleLabels";
import { latinToCyrillic } from "../../shared/utils/latinToCyrillic";

// ============================================================================
// ТИПЫ
// ============================================================================

export interface ExcelPeriod {
  periodNumber: number;
  /** «HH:MM» */
  startTime: string;
  /** «HH:MM» */
  endTime: string;
}

export interface ScheduleExcelInput {
  /** Понедельник недели (локальная полночь) */
  weekStart: Date;
  /** Активные академические часы из настроек расписания */
  periods: ExcelPeriod[];
  /** События недели (с присоединёнными группой, инструктором, аудиторией, дисциплиной) */
  events: ScheduleEvent[];
  /** Количество слушателей по id группы */
  studentCounts: Map<string, number>;
  /** Группы, у которых занятия начались до этой недели (получают пометку «продолжение») */
  continuingGroupIds: Set<string>;
  /** Названия аудиторий — показываются, если на неделе нет ни одного занятия */
  fallbackLocations?: string[];
  /** Организация в заголовке: «ООО «Airports Training Center»» */
  orgName: string;
  /** Должность утверждающего: «Директор ООО «Airports Training Center»» */
  approverPosition: string;
  /** ФИО утверждающего: «Мусаев О.М.» */
  approverName: string;
}

/** Начало и конец академического часа, минуты от полуночи */
export interface HourSpan {
  start: number;
  end: number;
}

// ============================================================================
// КОНСТАНТЫ ОФОРМЛЕНИЯ
// ============================================================================

const FONT_NAME = "Montserrat";
/** Группа | Дисциплина | Вид | Инструктор (с количеством слушателей после ФИО) */
const BLOCK_COLUMNS = 4;
const BLOCK_WIDTHS = [17, 30, 6, 22];
/** Колонки времени внутри каждого места проведения: Пара | Ак. час | Время */
const TIME_COLUMNS = 3;
const TIME_WIDTHS = [6.5, 6.5, 14];
const FIRST_LOC_COL = 4; // D: B — день недели, C — дата
const MIN_PERIODS_SHOWN = 8; // 4 пары — как в печатной форме; больше — только если есть занятия

/** Академический час в паре, где меняется дисциплина или вид занятия, и перерыв внутри такой пары */
export const MIXED_HOUR_MINUTES = 45;
export const MIXED_BREAK_MINUTES = 5;

const HEADER_FILL = "FFE2EFDA";
const DAY_FILL = "FFF2F2F2";
const WEEKEND_FILL = "FFD9D9D9";
const BLACK = "FF000000";

/** Сокращённые названия дней недели (пн … вс) */
const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/** Запасная сетка (совпадает с настройками по умолчанию): 14 академических часов по 40 минут (7 пар) */
const FALLBACK_PERIODS: ExcelPeriod[] = [
  { periodNumber: 1, startTime: "09:00", endTime: "09:40" },
  { periodNumber: 2, startTime: "09:40", endTime: "10:20" },
  { periodNumber: 3, startTime: "10:30", endTime: "11:10" },
  { periodNumber: 4, startTime: "11:10", endTime: "11:50" },
  { periodNumber: 5, startTime: "12:00", endTime: "12:40" },
  { periodNumber: 6, startTime: "12:40", endTime: "13:20" },
  { periodNumber: 7, startTime: "14:00", endTime: "14:40" },
  { periodNumber: 8, startTime: "14:40", endTime: "15:20" },
  { periodNumber: 9, startTime: "15:30", endTime: "16:10" },
  { periodNumber: 10, startTime: "16:10", endTime: "16:50" },
  { periodNumber: 11, startTime: "17:00", endTime: "17:40" },
  { periodNumber: 12, startTime: "17:40", endTime: "18:20" },
  { periodNumber: 13, startTime: "18:30", endTime: "19:10" },
  { periodNumber: 14, startTime: "19:10", endTime: "19:50" },
];

const UNASSIGNED_LOCATION = "Без аудитории";

const TIMING_NOTE =
  "Примечание: Одна пара общей продолжительностью 1 час 20 минут состоит из двух академических часов по 40 минут каждый. " +
  "Продолжительность перерыва между парами составляет 10 минут. После третьей пары устанавливается обеденный перерыв " +
  "продолжительностью 40 минут. По желанию слушателей, не планирующих принимать пищу, обеденный перерыв может быть сокращён " +
  "до 10 минут по согласованию с инструктором-преподавателем и администрацией Центра. В этом случае последующие занятия " +
  "могут быть начаты с 13:30 при условии соблюдения полного объёма учебной нагрузки и требований образовательной программы. " +
  "В парах, где внутри пары меняется дисциплина или вид занятия (Т/П → Э), академический час составляет 45 минут, " +
  "перерыв между академическими часами такой пары — 5 минут. Если занятие заканчивается на нечётном академическом часе " +
  "(1, 3, 5, 7, 9), последний академический час составляет 45 минут.";

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 540 → «9:00» (формат печатной формы) */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Дату без часового пояса → Excel-дата (полночь UTC, чтобы не «съезжал» день) */
function toExcelDate(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Русская запись периода: «с 21 по 27 сентября 2026 года» */
export function formatWeekRange(start: Date, end: Date): string {
  const sd = start.getDate();
  const ed = end.getDate();
  const sm = MONTHS_GENITIVE[start.getMonth()];
  const em = MONTHS_GENITIVE[end.getMonth()];
  const sy = start.getFullYear();
  const ey = end.getFullYear();

  if (sy !== ey) return `с ${sd} ${sm} ${sy} по ${ed} ${em} ${ey} года`;
  if (start.getMonth() !== end.getMonth())
    return `с ${sd} ${sm} по ${ed} ${em} ${ey} года`;
  return `с ${sd} по ${ed} ${em} ${ey} года`;
}

/**
 * «Мусаев Олимжон Мансурович» → «Мусаев О.».
 * Имя, записанное латиницей («Yunusov Xurshid»), переводится на русский: «Юнусов Х.».
 */
export function shortPersonName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const parts = latinToCyrillic(fullName).trim().split(/\s+/);
  if (parts.length === 1) return parts[0] ?? "";
  const first = parts[1] ?? "";
  return `${parts[0]} ${first.charAt(0).toUpperCase()}.`;
}

/** Грубая оценка числа строк, которые займёт текст в колонке заданной ширины */
function estimateLines(text: string, widthChars: number): number {
  if (!text) return 1;
  // Montserrat шире Calibri, на которой считается ширина колонки Excel
  const perLine = Math.max(4, Math.floor(widthChars * 0.82));
  return text.split("\n").reduce((sum, line) => {
    const words = line.split(" ");
    let lines = 1;
    let cur = 0;
    for (const word of words) {
      const len = word.length;
      if (cur === 0) {
        cur = len;
        while (cur > perLine) {
          lines++;
          cur -= perLine;
        }
      } else if (cur + 1 + len <= perLine) {
        cur += 1 + len;
      } else {
        lines++;
        cur = len;
        while (cur > perLine) {
          lines++;
          cur -= perLine;
        }
      }
    }
    return sum + lines;
  }, 0);
}

/** Максимум символов дисциплины в ячейке (≈ 3 строки при ширине колонки) */
const DISCIPLINE_MAX_CHARS = 66;

/**
 * Сокращает длинное название дисциплины до размера ячейки.
 * Если есть короткое первое предложение — берём его, иначе обрезаем по границе слова.
 */
export function shortenDiscipline(name: string, max = DISCIPLINE_MAX_CHARS): {
  text: string;
  truncated: boolean;
} {
  const clean = name.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return { text: clean, truncated: false };

  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] ?? "";
  if (firstSentence.length >= 12 && firstSentence.length <= max) {
    return { text: firstSentence.replace(/[.!?]+$/, ""), truncated: true };
  }

  let cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.5) cut = cut.slice(0, lastSpace);
  return { text: cut.replace(/[\s,;:–-]+$/, "") + "…", truncated: true };
}

function argb(hex: string): string {
  return "FF" + hex.replace("#", "").toUpperCase();
}

// ============================================================================
// ВРЕМЯ ПАР
// ============================================================================

function pairOf(periodNumber: number): number {
  return Math.ceil(periodNumber / 2);
}

/**
 * Время академических часов дня для одного места проведения.
 *
 * Обычная пара — по сетке настроек (40 + 40 минут). В «смешанной» паре (внутри пары меняется
 * дисциплина или вид занятия, например Т/П → Э) часы идут по 45 минут с перерывом 5 минут,
 * а все следующие пары сдвигаются на разницу — перерывы между парами сохраняются как в сетке.
 *
 * Если занятие заканчивается на нечётном часе (1, 3, 5, 7, 9) и второй час пары свободен,
 * этот последний час идёт 45 минут; следующие пары при этом не сдвигаются.
 *
 * @param periods      академические часы дня (по возрастанию номера)
 * @param mixedPairs   номера «смешанных» пар (45 + 5 + 45)
 * @param endingPairs  номера пар, где занятие кончается на нечётном часе (первый час — 45 минут)
 */
export function computeHourSpans(
  periods: ExcelPeriod[],
  mixedPairs: ReadonlySet<number>,
  endingPairs: ReadonlySet<number> = new Set(),
): Map<number, HourSpan> {
  const spans = new Map<number, HourSpan>();

  const byPair = new Map<number, ExcelPeriod[]>();
  for (const p of periods) {
    const pair = pairOf(p.periodNumber);
    if (!byPair.has(pair)) byPair.set(pair, []);
    byPair.get(pair)!.push(p);
  }

  let shift = 0;
  for (const pair of [...byPair.keys()].sort((a, b) => a - b)) {
    const hours = byPair.get(pair)!;
    const baseStart = toMinutes(hours[0]!.startTime);
    const baseEnd = toMinutes(hours[hours.length - 1]!.endTime);

    if (mixedPairs.has(pair) && hours.length === 2) {
      const start = baseStart + shift;
      const secondStart = start + MIXED_HOUR_MINUTES + MIXED_BREAK_MINUTES;
      spans.set(hours[0]!.periodNumber, { start, end: start + MIXED_HOUR_MINUTES });
      spans.set(hours[1]!.periodNumber, {
        start: secondStart,
        end: secondStart + MIXED_HOUR_MINUTES,
      });
      shift += 2 * MIXED_HOUR_MINUTES + MIXED_BREAK_MINUTES - (baseEnd - baseStart);
    } else if (endingPairs.has(pair)) {
      // Последний (нечётный) час занятия — 45 минут. Следующий час пары (свободный) идёт сразу
      // за ним, а следующие пары сдвигаются на разницу (+5 минут)
      const start = baseStart + shift;
      let cursor = start + MIXED_HOUR_MINUTES;
      spans.set(hours[0]!.periodNumber, { start, end: cursor });
      for (const h of hours.slice(1)) {
        const duration = toMinutes(h.endTime) - toMinutes(h.startTime);
        spans.set(h.periodNumber, { start: cursor, end: cursor + duration });
        cursor += duration;
      }
      shift += cursor - (baseEnd + shift);
    } else {
      for (const h of hours) {
        spans.set(h.periodNumber, {
          start: toMinutes(h.startTime) + shift,
          end: toMinutes(h.endTime) + shift,
        });
      }
    }
  }

  return spans;
}

function disciplineKey(ev: ScheduleEvent): string {
  return (ev.discipline?.name || ev.title || "").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Внутри пары идут разные занятия: меняется дисциплина или теория/практика сменяется экзаменом.
 * Если практика занимает пару целиком, а экзамен — следующую, это не «смешанная» пара.
 */
export function isMixedPair(first: ScheduleEvent | undefined, second: ScheduleEvent | undefined): boolean {
  if (!first || !second || first.id === second.id) return false;
  if (disciplineKey(first) !== disciplineKey(second)) return true;
  return (
    first.eventType !== second.eventType &&
    (first.eventType === "assessment" || second.eventType === "assessment")
  );
}

// ============================================================================
// ПЛАНИРОВАНИЕ СЕТКИ
// ============================================================================

interface PlacedEvent {
  event: ScheduleEvent;
  /** Индекс дня недели 0..6 */
  day: number;
  startMin: number;
  endMin: number;
  /** Номера академических часов, которые занимает событие */
  periodNumbers: number[];
}

interface LocationPlan {
  name: string;
  /** Для каждой «дорожки» (блока из 5 колонок): день|час → событие */
  lanes: Map<string, PlacedEvent>[];
  /** Индекс первой колонки локации (колонка «Пара») */
  firstCol: number;
}

interface DayPlan {
  index: number;
  date: Date;
  name: string;
  isWeekend: boolean;
  hasEvents: boolean;
  /** Академические часы, показанные в этот день */
  periods: ExcelPeriod[];
  /** Excel-строки дня (первая…последняя) */
  firstRow: number;
  lastRow: number;
}

function laneKey(day: number, periodNumber: number): string {
  return `${day}|${periodNumber}`;
}

/** Раскладывает события локации по «дорожкам» (блокам колонок) без пересечений по времени */
function assignLanes(placed: PlacedEvent[]): PlacedEvent[][] {
  const sorted = [...placed].sort(
    (a, b) =>
      a.day - b.day ||
      a.startMin - b.startMin ||
      b.endMin - a.endMin ||
      (a.event.group?.code || "").localeCompare(b.event.group?.code || "", "ru"),
  );

  const lanes: PlacedEvent[][] = [];
  const preferred = new Map<string, number>(); // группа → предпочтительная дорожка

  const conflicts = (lane: PlacedEvent[], p: PlacedEvent) =>
    lane.some(
      (q) => q.day === p.day && q.startMin < p.endMin && p.startMin < q.endMin,
    );

  for (const p of sorted) {
    const key = p.event.groupId || `event:${p.event.id}`;
    let laneIdx = -1;

    const pref = preferred.get(key);
    if (pref !== undefined && lanes[pref] && !conflicts(lanes[pref]!, p)) {
      laneIdx = pref;
    } else {
      laneIdx = lanes.findIndex((lane) => !conflicts(lane, p));
    }

    if (laneIdx === -1) {
      lanes.push([]);
      laneIdx = lanes.length - 1;
    }

    lanes[laneIdx]!.push(p);
    preferred.set(key, laneIdx);
  }

  return lanes;
}

// ============================================================================
// ПОСТРОЕНИЕ КНИГИ
// ============================================================================

export function buildScheduleWorkbook(input: ScheduleExcelInput): ExcelJS.Workbook {
  const weekStart = startOfDay(input.weekStart);
  const weekEnd = addDays(weekStart, 6);

  // ---- 1. Сетка академических часов -----------------------------------------
  const allPeriods = (input.periods.length ? input.periods : FALLBACK_PERIODS)
    .slice()
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // ---- 2. События → дни/часы -----------------------------------------------
  const placed: PlacedEvent[] = [];
  let skippedOutsideGrid = 0;

  for (const event of input.events) {
    if (event.isAllDay) continue;

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const day = Math.round(
      (startOfDay(start).getTime() - weekStart.getTime()) / 86_400_000,
    );
    if (day < 0 || day > 6) continue;

    const startMin = start.getHours() * 60 + start.getMinutes();
    // Занятие, перешедшее за полночь, обрезаем концом суток
    const endMin =
      startOfDay(end).getTime() > startOfDay(start).getTime()
        ? 24 * 60
        : end.getHours() * 60 + end.getMinutes();

    const periodNumbers = allPeriods
      .filter(
        (p) => startMin < toMinutes(p.endTime) && endMin > toMinutes(p.startTime),
      )
      .map((p) => p.periodNumber);

    if (periodNumbers.length === 0) {
      skippedOutsideGrid++;
      continue;
    }

    placed.push({ event, day, startMin, endMin, periodNumbers });
  }

  // Сколько академических часов показывать в каждый день: не меньше 8 (4 пары), больше — только
  // если в этот день есть более поздние занятия (как в печатной форме: пятница — 5 пар)
  const maxUsedByDay = new Map<number, number>();
  for (const p of placed) {
    maxUsedByDay.set(
      p.day,
      Math.max(maxUsedByDay.get(p.day) ?? 0, ...p.periodNumbers),
    );
  }
  const periodsForDay = (day: number): ExcelPeriod[] => {
    const maxUsed = maxUsedByDay.get(day) ?? 0;
    const limit = Math.max(MIN_PERIODS_SHOWN, maxUsed % 2 === 0 ? maxUsed : maxUsed + 1);
    return allPeriods.filter((p) => p.periodNumber <= limit);
  };
  const periodNumbersShown = new Set(allPeriods.map((p) => p.periodNumber));

  // ---- 3. Локации и дорожки ------------------------------------------------
  const byLocation = new Map<string, PlacedEvent[]>();
  for (const p of placed) {
    const name = p.event.classroom?.name?.trim() || UNASSIGNED_LOCATION;
    if (!byLocation.has(name)) byLocation.set(name, []);
    byLocation.get(name)!.push(p);
  }

  const locationNames = [...byLocation.keys()].sort((a, b) => {
    if (a === UNASSIGNED_LOCATION) return 1;
    if (b === UNASSIGNED_LOCATION) return -1;
    return a.localeCompare(b, "ru", { numeric: true });
  });

  const locations: LocationPlan[] = [];
  let colCursor = FIRST_LOC_COL;

  if (locationNames.length === 0) {
    // Пустая неделя — оставляем «пустую форму» с аудиториями из справочника
    const names = (input.fallbackLocations?.length
      ? input.fallbackLocations
      : ["Аудитория"]
    )
      .slice()
      .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
    for (const name of names) {
      locations.push({ name, lanes: [new Map()], firstCol: colCursor });
      colCursor += TIME_COLUMNS + BLOCK_COLUMNS;
    }
  } else {
    for (const name of locationNames) {
      const lanes = assignLanes(byLocation.get(name)!).map((laneEvents) => {
        const cells = new Map<string, PlacedEvent>();
        for (const p of laneEvents) {
          for (const n of p.periodNumbers) {
            if (!periodNumbersShown.has(n)) continue;
            const key = laneKey(p.day, n);
            if (!cells.has(key)) cells.set(key, p);
          }
        }
        return cells;
      });
      locations.push({ name, lanes, firstCol: colCursor });
      colCursor += TIME_COLUMNS + lanes.length * BLOCK_COLUMNS;
    }
  }

  const lastCol = colCursor - 1;
  const laneFirstCol = (loc: LocationPlan, lane: number) =>
    loc.firstCol + TIME_COLUMNS + lane * BLOCK_COLUMNS;

  // ---- 4. Дни и строки -----------------------------------------------------
  const HEADER_TOP = 10;
  const HEADER_BOTTOM = 12;
  const FIRST_DATA_ROW = 13;

  const dayHasEvents = new Set(placed.map((p) => p.day));
  const days: DayPlan[] = [];
  let rowCursor = FIRST_DATA_ROW;

  for (let i = 0; i < 7; i++) {
    const isWeekend = i >= 5;
    const hasEvents = dayHasEvents.has(i);
    const dayPeriods = periodsForDay(i);
    const rowCount = isWeekend && !hasEvents ? 1 : dayPeriods.length;
    days.push({
      index: i,
      date: addDays(weekStart, i),
      name: DAY_NAMES[i]!,
      isWeekend,
      hasEvents,
      periods: dayPeriods,
      firstRow: rowCursor,
      lastRow: rowCursor + rowCount - 1,
    });
    rowCursor += rowCount;
  }
  const lastRow = rowCursor - 1;

  // ---- 5. Книга и лист -----------------------------------------------------
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ATC Platform";
  workbook.created = new Date();

  const sheetName = `Неделя ${pad2(weekStart.getDate())}.${pad2(
    weekStart.getMonth() + 1,
  )}–${pad2(weekEnd.getDate())}.${pad2(weekEnd.getMonth() + 1)}`;

  const ws = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false, zoomScale: 70, zoomScaleNormal: 70 }],
    pageSetup: {
      paperSize: 8, // A3
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.2,
        bottom: 0.2,
        header: 0.3,
        footer: 0.3,
      },
      printTitlesRow: `${HEADER_TOP}:${HEADER_BOTTOM}`,
    },
  });

  // Ширина колонок
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 9;
  ws.getColumn(3).width = 11.5;
  for (const loc of locations) {
    for (let c = 0; c < TIME_COLUMNS; c++) {
      ws.getColumn(loc.firstCol + c).width = TIME_WIDTHS[c]!;
    }
    for (let lane = 0; lane < loc.lanes.length; lane++) {
      for (let c = 0; c < BLOCK_COLUMNS; c++) {
        ws.getColumn(laneFirstCol(loc, lane) + c).width = BLOCK_WIDTHS[c]!;
      }
    }
  }

  const baseFont: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 11 };
  const center: Partial<ExcelJS.Alignment> = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  // ---- 6. Блок «УТВЕРЖДАЮ» (правый верхний угол) ---------------------------
  const approvalFirstCol = Math.max(FIRST_LOC_COL, lastCol - BLOCK_COLUMNS + 1);
  const putApproval = (row: number, text: string, bold: boolean, height: number) => {
    ws.mergeCells(row, approvalFirstCol, row, lastCol);
    const cell = ws.getCell(row, approvalFirstCol);
    cell.value = text;
    cell.font = { ...baseFont, size: 14, bold };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    ws.getRow(row).height = height;
  };
  putApproval(1, "«УТВЕРЖДАЮ»", true, 24.75);
  putApproval(2, input.approverPosition, false, 21.6);
  putApproval(3, `______________________${input.approverName}`, false, 21.6);
  putApproval(5, `«_______» ${MONTHS_GENITIVE[weekStart.getMonth()]} ${weekStart.getFullYear()} г.`, false, 21.6);

  // ---- 7. Заголовок --------------------------------------------------------
  ws.mergeCells(8, 2, 8, lastCol);
  const title = ws.getCell(8, 2);
  title.value = `Расписание занятий и экзаменов в ${input.orgName} на период ${formatWeekRange(
    weekStart,
    weekEnd,
  )}`;
  title.font = { ...baseFont, size: 14, bold: true };
  title.alignment = center;
  ws.getRow(8).height = 26;

  // ---- 8. Шапка таблицы ----------------------------------------------------
  const headerFont: Partial<ExcelJS.Font> = { ...baseFont, size: 12, bold: true };
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };

  ["День недели", "Дата"].forEach((text, i) => {
    const col = 2 + i;
    ws.mergeCells(HEADER_TOP, col, HEADER_BOTTOM, col);
    ws.getCell(HEADER_TOP, col).value = text;
  });

  ws.mergeCells(HEADER_TOP, FIRST_LOC_COL, HEADER_TOP, lastCol);
  ws.getCell(HEADER_TOP, FIRST_LOC_COL).value = "Место проведения";

  const timeTitles = ["Пара", "Ак. Час", "Время"];
  const blockTitles = ["Группа", "Дисциплина", "Вид", "Инструктор"];
  for (const loc of locations) {
    const width = TIME_COLUMNS + loc.lanes.length * BLOCK_COLUMNS;
    ws.mergeCells(HEADER_TOP + 1, loc.firstCol, HEADER_TOP + 1, loc.firstCol + width - 1);
    ws.getCell(HEADER_TOP + 1, loc.firstCol).value = loc.name;
    timeTitles.forEach((text, i) => {
      ws.getCell(HEADER_BOTTOM, loc.firstCol + i).value = text;
    });
    for (let lane = 0; lane < loc.lanes.length; lane++) {
      blockTitles.forEach((text, i) => {
        ws.getCell(HEADER_BOTTOM, laneFirstCol(loc, lane) + i).value = text;
      });
    }
  }

  ws.getRow(HEADER_TOP).height = 21;
  ws.getRow(HEADER_TOP + 1).height = 31;
  ws.getRow(HEADER_BOTTOM).height = 36;

  for (let r = HEADER_TOP; r <= HEADER_BOTTOM; r++) {
    for (let c = 2; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = center;
    }
  }

  // ---- 9. Данные -----------------------------------------------------------
  const dayFill = (weekend: boolean): ExcelJS.Fill => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: weekend ? WEEKEND_FILL : DAY_FILL },
  });

  const rowHeights = new Map<number, number>();
  const bumpHeight = (row: number, height: number) =>
    rowHeights.set(row, Math.max(rowHeights.get(row) ?? 19.5, height));

  for (const day of days) {
    const compactWeekend = day.isWeekend && !day.hasEvents;
    const periods = day.periods;

    // День недели и дата — на весь блок дня
    if (day.lastRow > day.firstRow) {
      ws.mergeCells(day.firstRow, 2, day.lastRow, 2);
      ws.mergeCells(day.firstRow, 3, day.lastRow, 3);
    }
    const dayCell = ws.getCell(day.firstRow, 2);
    dayCell.value = day.name;
    dayCell.font = { ...baseFont, bold: true };
    dayCell.fill = dayFill(day.isWeekend);
    dayCell.alignment = center;

    const dateCell = ws.getCell(day.firstRow, 3);
    dateCell.value = toExcelDate(day.date);
    dateCell.numFmt = "dd.mm.yyyy";
    dateCell.font = baseFont;
    dateCell.fill = dayFill(day.isWeekend);
    dateCell.alignment = center;

    if (compactWeekend) {
      // Выходной без занятий: одна серая строка
      for (let c = FIRST_LOC_COL; c <= lastCol; c++) {
        ws.getCell(day.firstRow, c).fill = dayFill(true);
      }
      ws.getRow(day.firstRow).height = 17.4;
      continue;
    }

    for (const loc of locations) {
      // Пары, где меняется дисциплина или вид занятия, — по 45 минут (в любой из «дорожек» аудитории)
      const mixedPairs = new Set<number>();
      const endingPairs = new Set<number>();
      for (const period of periods) {
        if (period.periodNumber % 2 !== 1) continue;
        let mixed = false;
        let endsOnOdd = false;
        let secondUsed = false;
        for (const lane of loc.lanes) {
          const e1 = lane.get(laneKey(day.index, period.periodNumber))?.event;
          const e2 = lane.get(laneKey(day.index, period.periodNumber + 1))?.event;
          if (e2) secondUsed = true;
          if (isMixedPair(e1, e2)) mixed = true;
          else if (e1 && !e2) endsOnOdd = true; // занятие кончается на нечётном часе
        }
        const pair = pairOf(period.periodNumber);
        // Второй час пары занят другой «дорожкой» — по времени это та же смешанная пара
        if (mixed || (endsOnOdd && secondUsed)) mixedPairs.add(pair);
        else if (endsOnOdd) endingPairs.add(pair);
      }
      const spans = computeHourSpans(periods, mixedPairs, endingPairs);

      // Пара, академический час, время (свои для каждой аудитории)
      periods.forEach((period, i) => {
        const row = day.firstRow + i;

        const hourCell = ws.getCell(row, loc.firstCol + 1);
        hourCell.value = period.periodNumber;
        hourCell.font = baseFont;
        hourCell.alignment = center;

        const span = spans.get(period.periodNumber);
        const timeCell = ws.getCell(row, loc.firstCol + 2);
        timeCell.value = span
          ? `${formatMinutes(span.start)}-${formatMinutes(span.end)}`
          : "";
        timeCell.font = baseFont;
        timeCell.alignment = { horizontal: "center", vertical: "middle" };

        if (period.periodNumber % 2 === 1) {
          const partner = periods[i + 1];
          if (partner && partner.periodNumber === period.periodNumber + 1) {
            ws.mergeCells(row, loc.firstCol, row + 1, loc.firstCol);
          }
          const pairCell = ws.getCell(row, loc.firstCol);
          pairCell.value = pairOf(period.periodNumber);
          pairCell.font = baseFont;
          pairCell.alignment = center;
        }
      });

      // Занятия
      loc.lanes.forEach((lane, laneIdx) => {
        const c0 = laneFirstCol(loc, laneIdx);

        periods.forEach((period, i) => {
          const row = day.firstRow + i;
          const placedEvent = lane.get(laneKey(day.index, period.periodNumber));
          if (!placedEvent) return;
          const ev = placedEvent.event;

          const groupText = groupCellText(ev, input.continuingGroupIds);
          const color = resolveGroupColor(ev.groupId, ev.group?.colorIndex);

          const groupCell = ws.getCell(row, c0);
          groupCell.value = groupText;
          groupCell.font = { ...baseFont, bold: true, color: { argb: argb(readableTextOn(color)) } };
          groupCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(color) } };
          groupCell.alignment = center;

          const disciplineFull = ev.discipline?.name || ev.title || "";
          const { text: discipline, truncated } = shortenDiscipline(disciplineFull);
          const instructor = shortPersonName(ev.instructor?.fullName);
          const count = listenersCount(ev, input.studentCounts);

          const put = (offset: number, value: string | number, font: Partial<ExcelJS.Font>) => {
            const cell = ws.getCell(row, c0 + offset);
            cell.value = value;
            cell.font = font;
            cell.alignment = center;
          };
          put(1, discipline, { ...baseFont, size: 10 });
          if (truncated) ws.getCell(row, c0 + 1).note = disciplineFull;
          put(2, eventKindShort(ev.eventType), { ...baseFont, bold: true });
          const instructorCell = count !== null ? `${instructor} ${count}`.trim() : instructor;
          put(3, instructorCell, baseFont);

          // Высота строки под самый длинный текст (переносы включены)
          const lines = Math.max(
            estimateLines(discipline, BLOCK_WIDTHS[1]! * 1.1),
            estimateLines(instructorCell, BLOCK_WIDTHS[3]!),
          );
          bumpHeight(row, Math.max(19.5, lines * 15 + 4));
        });

        // Объединяем ячейку «Группа» по паре, если в обеих строках пары одна и та же группа
        for (let i = 0; i + 1 < periods.length; i++) {
          const p1 = periods[i]!;
          const p2 = periods[i + 1]!;
          if (p1.periodNumber % 2 !== 1 || p2.periodNumber !== p1.periodNumber + 1) continue;

          const e1 = lane.get(laneKey(day.index, p1.periodNumber))?.event;
          const e2 = lane.get(laneKey(day.index, p2.periodNumber))?.event;
          if (!e1 || !e2 || !e1.groupId || e1.groupId !== e2.groupId) continue;
          if (
            groupCellText(e1, input.continuingGroupIds) !==
            groupCellText(e2, input.continuingGroupIds)
          ) {
            continue;
          }

          const r1 = day.firstRow + i;
          ws.mergeCells(r1, c0, r1 + 1, c0);

          // Текст группы делит высоту двух строк
          const need = estimateLines(groupCellText(e1, input.continuingGroupIds), BLOCK_WIDTHS[0]!) * 15 + 4;
          bumpHeight(r1, need / 2);
          bumpHeight(r1 + 1, need / 2);
        }
      });
    }

    // Одинарные ячейки «Группа» (без пары) — учитываем высоту текста
    for (const loc of locations) {
      loc.lanes.forEach((lane, laneIdx) => {
        const c0 = laneFirstCol(loc, laneIdx);
        periods.forEach((period, i) => {
          const row = day.firstRow + i;
          const cell = ws.getCell(row, c0);
          if (cell.isMerged) return;
          const pe = lane.get(laneKey(day.index, period.periodNumber));
          if (!pe) return;
          const text = groupCellText(pe.event, input.continuingGroupIds);
          bumpHeight(row, estimateLines(text, BLOCK_WIDTHS[0]!) * 15 + 4);
        });
      });
    }
  }

  for (const day of days) {
    if (day.isWeekend && !day.hasEvents) continue;
    for (let r = day.firstRow; r <= day.lastRow; r++) {
      ws.getRow(r).height = rowHeights.get(r) ?? 19.5;
    }
  }

  // ---- 10. Границы (после объединений — чтобы рамка была и у скрытых ячеек) -
  const mediumLeftCols = new Set<number>([2, FIRST_LOC_COL]);
  const mediumRightCols = new Set<number>([3, lastCol]);
  for (const loc of locations) {
    mediumLeftCols.add(loc.firstCol);
    mediumRightCols.add(loc.firstCol + TIME_COLUMNS - 1);
    for (let lane = 0; lane < loc.lanes.length; lane++) {
      const start = laneFirstCol(loc, lane);
      mediumLeftCols.add(start);
      mediumRightCols.add(start + BLOCK_COLUMNS - 1);
    }
  }
  const dayFirstRows = new Set(days.map((d) => d.firstRow));
  const dayLastRows = new Set(days.map((d) => d.lastRow));

  const thin: Partial<ExcelJS.Border> = { style: "thin", color: { argb: BLACK } };
  const medium: Partial<ExcelJS.Border> = { style: "medium", color: { argb: BLACK } };

  for (let r = HEADER_TOP; r <= lastRow; r++) {
    for (let c = 2; c <= lastCol; c++) {
      const isDataRow = r >= FIRST_DATA_ROW;
      ws.getCell(r, c).border = {
        top: r === HEADER_TOP || (isDataRow && dayFirstRows.has(r)) ? medium : thin,
        bottom:
          r === HEADER_BOTTOM || (isDataRow && dayLastRows.has(r)) ? medium : thin,
        left: mediumLeftCols.has(c) ? medium : thin,
        right: mediumRightCols.has(c) ? medium : thin,
      };
    }
  }

  // ---- 11. Примечания ------------------------------------------------------
  const notes: Array<{ text: string; size: number; italic: boolean }> = [
    { text: TIMING_NOTE, size: 10, italic: false },
    {
      text: "Условные обозначения: Т — теория; П — практика; Э — проверка знаний (экзамен); Д — другое. Цвет ячейки «Группа» совпадает с цветом группы в календаре расписания.",
      size: 10,
      italic: true,
    },
  ];
  if (skippedOutsideGrid > 0) {
    notes.push({
      text: `Не отражено занятий вне сетки академических часов: ${skippedOutsideGrid}.`,
      size: 10,
      italic: true,
    });
  }

  let totalWidth = 0;
  for (let c = 2; c <= lastCol; c++) totalWidth += ws.getColumn(c).width ?? 8;

  notes.forEach((note, i) => {
    const row = lastRow + 2 + i;
    ws.mergeCells(row, 2, row, lastCol);
    const cell = ws.getCell(row, 2);
    cell.value = note.text;
    cell.font = { ...baseFont, size: note.size, italic: note.italic };
    cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    ws.getRow(row).height = Math.max(
      16,
      estimateLines(note.text, totalWidth * 1.1) * (note.size + 5) + 4,
    );
  });

  return workbook;
}

// ============================================================================
// ТЕКСТЫ ЯЧЕЕК
// ============================================================================

function isRetake(ev: ScheduleEvent): boolean {
  return (
    Boolean(ev.originalEventId) ||
    (Array.isArray(ev.allowedStudentIds) && ev.allowedStudentIds.length > 0)
  );
}

function groupCellText(ev: ScheduleEvent, continuing: Set<string>): string {
  const lines: string[] = [ev.group?.code || ev.title || "—"];
  if (ev.groupId && continuing.has(ev.groupId)) lines.push("продолжение");
  if (isRetake(ev)) lines.push("(пересдача)");
  return lines.join("\n");
}

function listenersCount(
  ev: ScheduleEvent,
  studentCounts: Map<string, number>,
): number | null {
  // Пересдача — только допущенные слушатели
  if (Array.isArray(ev.allowedStudentIds) && ev.allowedStudentIds.length > 0) {
    return ev.allowedStudentIds.length;
  }
  if (!ev.groupId) return null;
  return studentCounts.get(ev.groupId) ?? null;
}
