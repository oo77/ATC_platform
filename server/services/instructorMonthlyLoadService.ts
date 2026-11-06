/**
 * Нагрузка инструкторов за месяц: кто в каких группах вёл занятия и сколько академических часов.
 * Одна модель питает и вкладку «Нагрузка за месяц» в разделе «Инструкторы», и Excel-отчёт.
 * Часы считаются так же, как в истории курсов инструктора и на дашборде.
 */

import ExcelJS from "exceljs";

import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { getAcademicHourMinutes } from "../utils/academicHours";
import type {
  InstructorMonthlyLoad,
  LoadGroup,
  LoadHours,
  LoadInstructor,
} from "../types/instructorMonthlyLoad";

// ============================================================================
// МОДЕЛЬ
// ============================================================================

type EventType = "theory" | "practice" | "assessment" | "other";

interface LoadRow extends RowDataPacket {
  instructor_id: string;
  full_name: string;
  is_active: number;
  group_id: string | null;
  group_code: string | null;
  course_name: string | null;
  day: string;
  event_type: EventType | null;
  events: number;
  hours: number | string | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

/** YYYY-MM из запроса; некорректное значение — null */
export const parseMonth = (value: unknown): string | null => {
  const s = String(value ?? "");
  return MONTH_RE.test(s) ? s : null;
};

/** Границы месяца для DATETIME: [начало, начало следующего) */
const monthRange = (month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad2(m + 1)}`;
  return [`${month}-01 00:00:00`, `${next}-01 00:00:00`] as const;
};

const emptyHours = (): LoadHours => ({ theory: 0, practice: 0, assessment: 0, other: 0, total: 0 });

const addHours = (target: LoadHours, type: EventType | null, hours: number) => {
  const key: keyof LoadHours = type && type !== "other" ? type : "other";
  target[key] += hours;
  target.total += hours;
};

const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const roundHours = (h: LoadHours): LoadHours => ({
  theory: round1(h.theory),
  practice: round1(h.practice),
  assessment: round1(h.assessment),
  other: round1(h.other),
  total: round1(h.total),
});

const HOURS_SQL = `COALESCE(se.academic_hours, CEIL(COALESCE(se.duration_minutes, TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) / ?))`;

/**
 * Собирает нагрузку инструкторов за месяц.
 * @param onlyConducted только занятия, которые уже закончились
 */
export async function loadInstructorMonthlyLoad(
  month: string,
  onlyConducted: boolean,
): Promise<InstructorMonthlyLoad> {
  const [from, to] = monthRange(month);
  const conductedSql = onlyConducted ? "AND se.end_time < NOW()" : "";
  const academicHourMinutes = await getAcademicHourMinutes();

  const rows = await executeQuery<LoadRow[]>(
    `SELECT se.instructor_id, i.full_name, i.is_active,
            se.group_id, sg.code AS group_code, c.name AS course_name,
            DATE_FORMAT(se.start_time, '%Y-%m-%d') AS day,
            se.event_type,
            COUNT(*) AS events,
            SUM(${HOURS_SQL}) AS hours
       FROM schedule_events se
       JOIN instructors i ON i.id = se.instructor_id
       LEFT JOIN study_groups sg ON sg.id = se.group_id
       LEFT JOIN courses c ON c.id = sg.course_id
      WHERE se.start_time >= ? AND se.start_time < ?
        ${conductedSql}
      GROUP BY se.instructor_id, i.full_name, i.is_active,
               se.group_id, sg.code, c.name, day, se.event_type`,
    [academicHourMinutes, from, to],
  );

  const [unassigned] = await executeQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt
       FROM schedule_events se
      WHERE se.instructor_id IS NULL
        AND se.start_time >= ? AND se.start_time < ?
        ${conductedSql}`,
    [from, to],
  );

  interface GroupAcc {
    group: LoadGroup;
    days: Set<string>;
  }
  interface InstructorAcc {
    instructor: LoadInstructor;
    days: Set<string>;
    groups: Map<string, GroupAcc>;
  }

  const byInstructor = new Map<string, InstructorAcc>();
  for (const r of rows) {
    const events = Number(r.events) || 0;
    const hours = Number(r.hours) || 0;

    let acc = byInstructor.get(r.instructor_id);
    if (!acc) {
      acc = {
        instructor: {
          id: r.instructor_id,
          fullName: r.full_name,
          isActive: Boolean(r.is_active),
          events: 0,
          days: 0,
          hours: emptyHours(),
          groups: [],
        },
        days: new Set(),
        groups: new Map(),
      };
      byInstructor.set(r.instructor_id, acc);
    }
    acc.instructor.events += events;
    addHours(acc.instructor.hours, r.event_type, hours);
    acc.days.add(r.day);

    const groupKey = r.group_id ?? "";
    let g = acc.groups.get(groupKey);
    if (!g) {
      g = {
        group: {
          id: r.group_id,
          code: r.group_code || "Без группы",
          courseName: r.course_name,
          events: 0,
          days: 0,
          firstDay: r.day,
          lastDay: r.day,
          hours: emptyHours(),
        },
        days: new Set(),
      };
      acc.groups.set(groupKey, g);
    }
    g.group.events += events;
    addHours(g.group.hours, r.event_type, hours);
    g.days.add(r.day);
    if (r.day < g.group.firstDay) g.group.firstDay = r.day;
    if (r.day > g.group.lastDay) g.group.lastDay = r.day;
  }

  const summaryHours = emptyHours();
  const groupIds = new Set<string>();
  const programs = new Set<string>();
  let events = 0;

  const instructors = [...byInstructor.values()].map(({ instructor, days, groups }) => {
    events += instructor.events;
    (Object.keys(summaryHours) as (keyof LoadHours)[]).forEach((k) => {
      summaryHours[k] += instructor.hours[k];
    });
    return {
      ...instructor,
      days: days.size,
      hours: roundHours(instructor.hours),
      groups: [...groups.values()]
        .map(({ group, days: groupDays }) => {
          if (group.id) groupIds.add(group.id);
          if (group.courseName) programs.add(group.courseName);
          return { ...group, days: groupDays.size, hours: roundHours(group.hours) };
        })
        .sort(
          (a, b) =>
            a.firstDay.localeCompare(b.firstDay) || a.code.localeCompare(b.code, "ru"),
        ),
    };
  });

  instructors.sort(
    (a, b) => b.hours.total - a.hours.total || a.fullName.localeCompare(b.fullName, "ru"),
  );

  return {
    month,
    onlyConducted,
    summary: {
      instructors: instructors.length,
      events,
      groups: groupIds.size,
      programs: programs.size,
      hours: roundHours(summaryHours),
      unassignedEvents: Number(unassigned?.cnt) || 0,
    },
    instructors,
  };
}

// ============================================================================
// EXCEL
// ============================================================================

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

/** «Октябрь 2026» */
export const monthTitle = (month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

const FONT = "Calibri";
const COLOR = {
  brand: "FF3641F5",
  brandSoft: "FFECF3FF",
  header: "FF1D2939",
  text: "FF101828",
  muted: "FF667085",
  border: "FFD0D5DD",
  zebra: "FFF9FAFB",
} as const;

const thin = (argb: string = COLOR.border) => ({ style: "thin" as const, color: { argb } });

/** Дата для ячейки Excel (как настоящая дата, чтобы работали сортировка и фильтры) */
const excelDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
};

interface Column {
  header: string;
  width: number;
  numFmt?: string;
  align?: "left" | "center" | "right";
  wrap?: boolean;
}

// Часы без numFmt: «General» показывает 36 и 36.5 без лишней запятой
const hoursColumns = (): Column[] => [
  { header: "Теория\nак. ч", width: 11, align: "center" },
  { header: "Практика\nак. ч", width: 11, align: "center" },
  { header: "Проверка знаний\nак. ч", width: 13, align: "center" },
  { header: "Прочее\nак. ч", width: 11, align: "center" },
  { header: "Всего\nак. ч", width: 11, align: "center" },
];

const hoursValues = (h: LoadHours) => [h.theory, h.practice, h.assessment, h.other, h.total];

/** Примерное число строк текста при переносе по словам (ExcelJS не подбирает высоту сам) */
const wrappedLines = (text: string, width: number) => {
  const perLine = Math.max(1, Math.floor((width - 1) * 1.1));
  let lines = 1;
  let current = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current === 0) current = word.length;
    else if (current + 1 + word.length <= perLine) current += 1 + word.length;
    else {
      lines++;
      current = word.length;
    }
  }
  return lines;
};

function writeSheetTitle(ws: ExcelJS.Worksheet, model: InstructorMonthlyLoad, title: string, span: number) {
  const now = new Date();
  const generated = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const scope = model.onlyConducted ? "только проведённые занятия" : "все занятия по расписанию";

  ws.mergeCells(1, 1, 1, span);
  const t = ws.getCell(1, 1);
  t.value = `${title} — ${monthTitle(model.month)}`;
  t.font = { name: FONT, size: 15, bold: true, color: { argb: COLOR.brand } };
  ws.getRow(1).height = 24;

  ws.mergeCells(2, 1, 2, span);
  const p = ws.getCell(2, 1);
  p.value = `Учтены: ${scope}  ·  Сформирован: ${generated}`;
  p.font = { name: FONT, size: 10, color: { argb: COLOR.muted } };
}

/** Таблица: шапка, строки с зеброй, строка «Итого» (если передана) */
function writeTable(
  ws: ExcelJS.Worksheet,
  startRow: number,
  columns: Column[],
  rows: (string | number | Date | null)[][],
  total?: (string | number | null)[],
) {
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  const head = ws.getRow(startRow);
  head.values = columns.map((c) => c.header);
  head.height = 32;
  head.eachCell((cell) => {
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.header } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { top: thin(COLOR.header), bottom: thin(COLOR.header), left: thin("FF475467"), right: thin("FF475467") };
  });

  rows.forEach((values, index) => {
    const row = ws.getRow(startRow + 1 + index);
    row.values = values;
    const lines = Math.max(
      1,
      ...columns.map((c, ci) =>
        c.wrap && typeof values[ci] === "string" ? wrappedLines(values[ci] as string, c.width) : 1,
      ),
    );
    row.height = Math.max(18, lines * 13.5 + 6);
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      cell.font = { name: FONT, size: 10, color: { argb: COLOR.text } };
      cell.alignment = { vertical: "middle", horizontal: c.align ?? "left", wrapText: c.wrap ?? false };
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.border = { top: thin(), bottom: thin(), left: thin(), right: thin() };
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.zebra } };
      }
    });
  });

  if (rows.length) {
    ws.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: startRow + rows.length, column: columns.length },
    };
  }
  ws.views = [{ state: "frozen", ySplit: startRow, xSplit: 0 }];

  if (total) {
    const row = ws.getRow(startRow + rows.length + 1);
    row.values = total;
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      cell.font = { name: FONT, size: 10, bold: true, color: { argb: COLOR.text } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brandSoft } };
      cell.border = { top: thin(COLOR.brand), bottom: thin(COLOR.brand), left: thin(), right: thin() };
      cell.alignment = { vertical: "middle", horizontal: c.align ?? "left" };
      if (c.numFmt) cell.numFmt = c.numFmt;
    });
  }
}

export async function buildInstructorMonthlyLoadWorkbook(model: InstructorMonthlyLoad): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ATC Platform";
  wb.created = new Date();
  const pageSetup = {
    orientation: "landscape" as const,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  const s = model.summary;

  // ---------------------------------------------------------------- Инструкторы
  {
    const ws = wb.addWorksheet("Инструкторы", { pageSetup });
    const columns: Column[] = [
      { header: "№", width: 5, align: "center" },
      { header: "Инструктор", width: 34, wrap: true },
      { header: "Группы", width: 34, wrap: true },
      { header: "Дней", width: 8, align: "center" },
      { header: "Занятий", width: 9, align: "center" },
      ...hoursColumns(),
    ];
    writeSheetTitle(ws, model, "Нагрузка инструкторов", columns.length);

    const rows = model.instructors.map((i, idx) => [
      idx + 1,
      i.fullName + (i.isActive ? "" : " (неактивен)"),
      i.groups.map((g) => g.code).join(", "),
      i.days,
      i.events,
      ...hoursValues(i.hours),
    ]);
    writeTable(ws, 4, columns, rows, [
      "",
      "Итого",
      s.groups ? `${s.groups} ${plural(s.groups, ["группа", "группы", "групп"])}` : "",
      "",
      s.events,
      ...hoursValues(s.hours),
    ]);

    if (s.unassignedEvents) {
      const note = ws.getCell(4 + rows.length + 3, 2);
      note.value = `Занятий без инструктора в этом месяце: ${s.unassignedEvents} (в таблицу не вошли)`;
      note.font = { name: FONT, size: 10, italic: true, color: { argb: COLOR.muted } };
    }
  }

  // ---------------------------------------------------------------- По группам
  {
    const ws = wb.addWorksheet("По группам", { pageSetup });
    const columns: Column[] = [
      { header: "№", width: 5, align: "center" },
      { header: "Инструктор", width: 30, wrap: true },
      { header: "Группа", width: 16, align: "center" },
      { header: "Программа обучения", width: 50, wrap: true },
      { header: "Первое занятие", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Последнее занятие", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Дней", width: 8, align: "center" },
      { header: "Занятий", width: 9, align: "center" },
      ...hoursColumns(),
    ];
    writeSheetTitle(ws, model, "Нагрузка инструкторов по группам", columns.length);

    const items = model.instructors.flatMap((i) => i.groups.map((g) => ({ i, g })));
    const rows = items.map(({ i, g }, idx) => [
      idx + 1,
      i.fullName,
      g.code,
      g.courseName ?? "",
      excelDate(g.firstDay),
      excelDate(g.lastDay),
      g.days,
      g.events,
      ...hoursValues(g.hours),
    ]);
    writeTable(ws, 4, columns, rows, [
      "", "Итого", "", "", null, null, "", s.events, ...hoursValues(s.hours),
    ]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
