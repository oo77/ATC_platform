/**
 * Excel «Расписание занятий» группы для конкретного инструктора: только те дни и занятия,
 * которые инструктор ведёт в этой группе. Оформление повторяет лист группы из эталонной книги
 * (шапка курса, таблица «Дата / День недели / Пара / Время / Название дисциплины / Тип /
 * Аудитория / Инструктор», подпись специалиста), шрифт Montserrat.
 */

import ExcelJS from "exceljs";

import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import {
  getScheduleEvents,
  getSchedulePeriods,
  type ScheduleEvent,
} from "../repositories/scheduleRepository";

// ============================================================================
// МОДЕЛЬ
// ============================================================================

export interface InstructorScheduleRow {
  /** Подпись в колонке «Пара»: 1, 2, 3, 4 … */
  pair: string;
  time: string;
  discipline: string;
  type: string;
  classroom: string;
  instructor: string;
}

export interface InstructorScheduleDay {
  /** dd.mm.yyyy */
  date: string;
  weekday: string;
  rows: InstructorScheduleRow[];
}

export interface InstructorScheduleModel {
  groupCode: string;
  courseNumber: string;
  courseName: string;
  courseStart: string;
  courseEnd: string;
  instructorName: string;
  days: InstructorScheduleDay[];
}

const WEEKDAYS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const TYPE_LABELS: Record<string, string> = {
  theory: "Теория",
  practice: "Практика",
  assessment: "Экзамен",
  other: "Другое",
};

/** Специалист, подписывающий расписание (как в остальных печатных формах) */
const SIGNER = "И.Р. Садиров";

const pad2 = (n: number) => String(n).padStart(2, "0");

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** «09:00» → «9:00» */
const formatClock = (hhmm: string) => {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}:${m}`;
};

/** Дата из БД (Date или строка YYYY-MM-DD) → dd.mm.yyyy */
function formatDmy(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** «Тогаев Олим Мансурович» → «Тогаев О.М.» */
function shortName(fullName: string | undefined | null): string {
  if (!fullName) return "";
  const [last, ...rest] = fullName.trim().split(/\s+/);
  const initials = rest
    .filter(Boolean)
    .map((p) => `${p[0]!.toUpperCase()}.`)
    .join("");
  return initials ? `${last} ${initials}` : last || "";
}

/** Подпись пары в колонке «Пара»: академические часы 1–2 → пара 1, 3–4 → пара 2 и т.д. */
function pairLabel(periodNumber: number): string {
  return String(Math.ceil(periodNumber / 2));
}

interface GroupMetaRow extends RowDataPacket {
  code: string;
  start_date: Date | string;
  end_date: Date | string;
  course_name: string;
  course_code: string;
  instructor_name: string | null;
}

export async function loadInstructorScheduleModel(
  instructorId: string,
  groupId: string,
): Promise<InstructorScheduleModel | null> {
  const [meta] = await executeQuery<GroupMetaRow[]>(
    `SELECT sg.code, sg.start_date, sg.end_date,
            c.name AS course_name, c.code AS course_code,
            (SELECT full_name FROM instructors WHERE id = ?) AS instructor_name
       FROM study_groups sg
       JOIN courses c ON c.id = sg.course_id
      WHERE sg.id = ?`,
    [instructorId, groupId],
  );
  if (!meta) return null;

  const [events, periods] = await Promise.all([
    getScheduleEvents({ groupId, instructorId }),
    getSchedulePeriods(true),
  ]);

  const timed = events.filter((e) => !e.isAllDay);
  periods.sort((a, b) => a.periodNumber - b.periodNumber);

  // Событие → номера академических часов, которые оно занимает
  const placed = timed.map((event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const sameDay = start.toDateString() === end.toDateString();
    const endMin = sameDay ? end.getHours() * 60 + end.getMinutes() : 24 * 60;
    const periodNumbers = periods
      .filter(
        (p) => startMin < toMinutes(p.endTime) && endMin > toMinutes(p.startTime),
      )
      .map((p) => p.periodNumber);
    return { event, start, periodNumbers };
  });

  // Сетка: все академические часы до последнего занятого, округлённого до целой пары
  const maxUsed = placed.reduce(
    (m, p) => Math.max(m, ...p.periodNumbers, 0),
    0,
  );
  const limit = maxUsed % 2 === 0 ? maxUsed : maxUsed + 1;
  const grid = periods.filter((p) => p.periodNumber <= limit);

  const byDay = new Map<string, typeof placed>();
  for (const p of placed) {
    const key = `${p.start.getFullYear()}-${pad2(p.start.getMonth() + 1)}-${pad2(p.start.getDate())}`;
    const list = byDay.get(key) ?? [];
    list.push(p);
    byDay.set(key, list);
  }

  const days: InstructorScheduleDay[] = [...byDay.keys()].sort().map((key) => {
    const dayEvents = byDay.get(key)!;
    const first = dayEvents[0]!.start;
    const rows: InstructorScheduleRow[] = grid.map((period) => {
      const hit = dayEvents.find((p) => p.periodNumbers.includes(period.periodNumber));
      const ev: ScheduleEvent | undefined = hit?.event;
      return {
        pair: pairLabel(period.periodNumber),
        time: `${formatClock(period.startTime)}-${formatClock(period.endTime)}`,
        discipline: ev ? ev.discipline?.name || ev.title : "",
        type: ev ? TYPE_LABELS[ev.eventType] || "" : "",
        classroom: ev?.classroom?.name || "",
        instructor: ev ? shortName(ev.instructor?.fullName) : "",
      };
    });
    return {
      date: formatDmy(first),
      weekday: WEEKDAYS[first.getDay()]!,
      rows,
    };
  });

  return {
    groupCode: meta.code,
    courseNumber: meta.course_code,
    courseName: meta.course_name,
    courseStart: formatDmy(meta.start_date),
    courseEnd: formatDmy(meta.end_date),
    instructorName: meta.instructor_name || "",
    days,
  };
}


// ============================================================================
// КНИГА
// ============================================================================

const FONT = "Montserrat";
const SIZE = 14;

const MEDIUM = { style: "medium" } as const;
const ALL_MEDIUM: Partial<ExcelJS.Borders> = {
  top: MEDIUM,
  left: MEDIUM,
  bottom: MEDIUM,
  right: MEDIUM,
};

function setCell(
  ws: ExcelJS.Worksheet,
  address: string,
  value: ExcelJS.CellValue,
  opts: {
    bold?: boolean;
    size?: number;
    horizontal?: ExcelJS.Alignment["horizontal"];
    rotate?: number;
    border?: boolean;
  } = {},
) {
  const cell = ws.getCell(address);
  cell.value = value;
  cell.font = { name: FONT, size: opts.size ?? SIZE, bold: !!opts.bold };
  cell.alignment = {
    horizontal: opts.horizontal ?? "center",
    vertical: "middle",
    wrapText: true,
    ...(opts.rotate ? { textRotation: opts.rotate } : {}),
  };
  if (opts.border) cell.border = ALL_MEDIUM;
}

/** Рамка по всем ячейкам объединённого диапазона */
function borderRange(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = ALL_MEDIUM;
    }
  }
}

export async function buildInstructorScheduleWorkbook(
  model: InstructorScheduleModel,
): Promise<Buffer> {
  if (model.days.length === 0) {
    throw new Error("У инструктора нет занятий в этой группе");
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(model.groupCode.slice(0, 31).replace(/[\/?*[\]:]/g, "-"), {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: false }],
  });

  // A Дата | B День | C Пара | D Время | E Дисциплина | F Тип | G Аудитория | H:I Инструктор
  [20, 14.7, 15.1, 19.3, 80.7, 20.1, 26, 9.6, 22].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // ---- Шапка --------------------------------------------------------------
  ws.mergeCells("A1:I1");
  setCell(ws, "A1", `КУРС № ${model.courseNumber}`, { bold: true });
  ws.getRow(1).height = 21.75;

  ws.mergeCells("A2:I2");
  setCell(ws, "A2", model.courseName.toUpperCase());
  ws.getRow(2).height = 41.25;

  ws.mergeCells("A3:I3");
  setCell(ws, "A3", "РАСПИСАНИЕ ЗАНЯТИЙ", { bold: true });
  ws.getRow(3).height = 21.75;

  setCell(ws, "A4", "Группа:");
  ws.mergeCells("B4:D4");
  setCell(ws, "B4", model.groupCode, { bold: true });
  setCell(ws, "E4", "Начало курса:", { horizontal: "right" });
  setCell(ws, "F4", `${model.courseStart} г.`, { bold: true });
  ws.mergeCells("G4:H4");
  setCell(ws, "G4", "Окончание курса:");
  setCell(ws, "I4", `${model.courseEnd} г.`, { bold: true });
  ws.getRow(4).height = 32.25;

  // ---- Шапка таблицы ------------------------------------------------------
  const headRow = 6;
  ["Дата", "День недели", "Пара", "Время", "Название дисциплины", "Тип", "Аудитория"].forEach(
    (title, i) => {
      setCell(ws, ws.getCell(headRow, i + 1).address, title, { bold: true, border: true });
    },
  );
  ws.mergeCells(headRow, 8, headRow, 9);
  setCell(ws, ws.getCell(headRow, 8).address, "Инструктор", { bold: true });
  borderRange(ws, headRow, 8, headRow, 9);
  ws.getRow(headRow).height = 42.75;

  // ---- Дни ----------------------------------------------------------------
  let r = headRow + 1;
  for (const day of model.days) {
    const dayStart = r;
    const dayEnd = r + day.rows.length - 1;

    day.rows.forEach((row, i) => {
      const rr = dayStart + i;
      ws.getRow(rr).height = 42.75;
      setCell(ws, `D${rr}`, row.time, { border: true });
      setCell(ws, `E${rr}`, row.discipline, { border: true });
      setCell(ws, `F${rr}`, row.type, { border: true });
      setCell(ws, `G${rr}`, row.classroom, { border: true });
      ws.mergeCells(rr, 8, rr, 9);
      setCell(ws, `H${rr}`, row.instructor);
      borderRange(ws, rr, 8, rr, 9);
    });

    // «Дата» и «День недели» — одним блоком на весь день
    ws.mergeCells(dayStart, 1, dayEnd, 1);
    setCell(ws, `A${dayStart}`, `${day.date} г`, { bold: true });
    borderRange(ws, dayStart, 1, dayEnd, 1);

    ws.mergeCells(dayStart, 2, dayEnd, 2);
    setCell(ws, `B${dayStart}`, day.weekday, { bold: true, rotate: 90 });
    borderRange(ws, dayStart, 2, dayEnd, 2);

    // «Пара» — по две строки (академические часы), как в эталоне
    let i = 0;
    while (i < day.rows.length) {
      const label = day.rows[i]!.pair;
      const span = day.rows[i + 1]?.pair === label ? 2 : 1;
      const top = dayStart + i;
      if (span === 2) ws.mergeCells(top, 3, top + 1, 3);
      setCell(ws, `C${top}`, Number(label), { bold: true });
      borderRange(ws, top, 3, top + span - 1, 3);
      i += span;
    }

    r = dayEnd + 1;
  }

  // ---- Подпись ------------------------------------------------------------
  const signRow = r + 1;
  ws.mergeCells(signRow, 2, signRow, 3);
  setCell(ws, `B${signRow}`, "Разработал:", { bold: true, horizontal: "right" });
  setCell(ws, `D${signRow}`, "Специалист");
  setCell(ws, `F${signRow}`, SIGNER);
  ws.getRow(signRow).height = 43.5;
  setCell(ws, `E${signRow + 1}`, "Подпись", { size: 12 });
  ws.getRow(signRow + 1).height = 18.75;
  ws.getCell(`E${signRow}`).border = { bottom: { style: "thin" } };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
