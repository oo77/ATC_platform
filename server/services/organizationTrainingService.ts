/**
 * Аналитика обучения сотрудников организации: по каким программам и в каких группах учились
 * слушатели, кто из них получил сертификат и какой именно (название шаблона сертификата).
 * Одна модель питает и дашборд в карточке организации, и Excel-отчёт.
 */

import ExcelJS from "exceljs";

import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import type {
  EnrollmentState,
  GroupStatus,
  OrganizationTraining,
  TrainingCertificate,
  TrainingCounts,
  TrainingGroup,
  TrainingProgram,
  TrainingStudent,
} from "../types/organizationTraining";

// ============================================================================
// МОДЕЛЬ
// ============================================================================

interface EnrollmentRow extends RowDataPacket {
  student_id: string;
  full_name: string;
  pinfl: string;
  position: string;
  department: string | null;
  group_id: string | null;
  group_code: string | null;
  start_date: string | null;
  end_date: string | null;
  course_id: string | null;
  course_name: string | null;
  course_code: string | null;
  course_hours: number | null;
  cert_id: string | null;
  certificate_number: string | null;
  cert_status: "issued" | "revoked" | null;
  issue_date: string | null;
  template_name: string | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const groupStatus = (start: string | null, end: string | null, today: string): GroupStatus => {
  if (end && end < today) return "completed";
  if (start && start > today) return "planned";
  if (!start && !end) return "completed";
  return "active";
};

/** Чем выше — тем «лучше» итог слушателя, когда он учился в нескольких группах */
const STATE_RANK: Record<EnrollmentState, number> = {
  no_certificate: 0,
  in_training: 1,
  certified: 2,
};

const emptyCounts = (): TrainingCounts => ({
  students: 0,
  certified: 0,
  noCertificate: 0,
  inTraining: 0,
  certificates: 0,
});

interface Enrollment {
  programKey: string;
  groupKey: string;
  group: Omit<TrainingGroup, "counts" | "certificateNames" | "students">;
  program: Pick<TrainingProgram, "id" | "name" | "code" | "hours">;
  student: TrainingStudent;
}

/** Считает уникальных слушателей по лучшему итогу и выданные сертификаты */
const countEnrollments = (items: Enrollment[]): TrainingCounts => {
  const best = new Map<string, EnrollmentState>();
  let certificates = 0;
  for (const e of items) {
    const prev = best.get(e.student.id);
    if (!prev || STATE_RANK[e.student.state] > STATE_RANK[prev]) {
      best.set(e.student.id, e.student.state);
    }
    if (e.student.certificate?.status === "issued") certificates++;
  }
  const counts = emptyCounts();
  counts.students = best.size;
  counts.certificates = certificates;
  for (const state of best.values()) {
    if (state === "certified") counts.certified++;
    else if (state === "in_training") counts.inTraining++;
    else counts.noCertificate++;
  }
  return counts;
};

const certificateNamesOf = (items: Enrollment[]) =>
  [
    ...new Set(
      items
        .filter((e) => e.student.certificate?.status === "issued" && e.student.certificate.name)
        .map((e) => e.student.certificate!.name!),
    ),
  ].sort((a, b) => a.localeCompare(b, "ru"));

const ENROLLMENTS_SQL = `
  SELECT
    s.id AS student_id, s.full_name, s.pinfl, s.position, s.department,
    sg.id AS group_id, sg.code AS group_code,
    DATE_FORMAT(sg.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(sg.end_date, '%Y-%m-%d') AS end_date,
    c.id AS course_id, c.name AS course_name, c.code AS course_code, c.total_hours AS course_hours,
    ic.id AS cert_id, ic.certificate_number, ic.status AS cert_status,
    DATE_FORMAT(ic.issue_date, '%Y-%m-%d') AS issue_date,
    ct.name AS template_name
  FROM study_group_students sgs
  JOIN students s ON s.id = sgs.student_id
  JOIN study_groups sg ON sg.id = sgs.group_id
  JOIN courses c ON c.id = sg.course_id
  LEFT JOIN issued_certificates ic ON ic.group_id = sgs.group_id AND ic.student_id = sgs.student_id
  LEFT JOIN certificate_templates ct ON ct.id = ic.template_id
  WHERE s.organization_id = ?

  UNION ALL

  -- Сертификаты, у которых нет записи о зачислении (слушателя убрали из группы, импорт и т.п.)
  SELECT
    s.id, s.full_name, s.pinfl, s.position, s.department,
    sg.id, COALESCE(sg.code, ic.group_code),
    DATE_FORMAT(COALESCE(sg.start_date, ic.group_start_date), '%Y-%m-%d'),
    DATE_FORMAT(COALESCE(sg.end_date, ic.group_end_date), '%Y-%m-%d'),
    c.id, COALESCE(c.name, ic.course_name), COALESCE(c.code, ic.course_code),
    COALESCE(c.total_hours, ic.course_hours),
    ic.id, ic.certificate_number, ic.status,
    DATE_FORMAT(ic.issue_date, '%Y-%m-%d'),
    ct.name
  FROM issued_certificates ic
  JOIN students s ON s.id = ic.student_id
  LEFT JOIN study_groups sg ON sg.id = ic.group_id
  LEFT JOIN courses c ON c.id = sg.course_id
  LEFT JOIN certificate_templates ct ON ct.id = ic.template_id
  WHERE s.organization_id = ?
    AND NOT EXISTS (
      SELECT 1 FROM study_group_students x
      WHERE x.group_id = ic.group_id AND x.student_id = ic.student_id
    )
`;

/**
 * Собирает аналитику обучения организации.
 * @param year фильтр по году начала группы (null — за всё время)
 * @returns null, если организации нет
 */
export async function loadOrganizationTraining(
  organizationId: string,
  year: number | null,
): Promise<OrganizationTraining | null> {
  const [org] = await executeQuery<RowDataPacket[]>(
    `SELECT o.id, o.name, o.code, o.inn,
            (SELECT COUNT(*) FROM students s WHERE s.organization_id = o.id) AS employees
     FROM organizations o WHERE o.id = ?`,
    [organizationId],
  );
  if (!org) return null;

  const rows = await executeQuery<EnrollmentRow[]>(ENROLLMENTS_SQL, [organizationId, organizationId]);
  const today = todayYmd();

  // Одна пара «группа + слушатель» = одно зачисление. Если сертификатов на пару несколько
  // (отозван и выдан заново), берём выданный, а среди равных — более поздний.
  const byPair = new Map<string, Enrollment>();
  for (const r of rows) {
    const programKey = r.course_id ?? `ext:${r.course_name ?? ""}`;
    const groupKey = r.group_id ?? `ext:${programKey}:${r.group_code ?? ""}`;
    const status = groupStatus(r.start_date, r.end_date, today);

    const certificate: TrainingCertificate | null = r.cert_id
      ? {
          number: r.certificate_number ?? "",
          name: r.template_name,
          issueDate: r.issue_date,
          status: r.cert_status === "revoked" ? "revoked" : "issued",
        }
      : null;

    const state: EnrollmentState =
      certificate?.status === "issued"
        ? "certified"
        : status === "completed"
          ? "no_certificate"
          : "in_training";

    const pairKey = `${groupKey}|${r.student_id}`;
    const prev = byPair.get(pairKey);
    if (prev) {
      const a = prev.student.certificate;
      const better =
        certificate &&
        (!a ||
          (certificate.status === "issued" && a.status !== "issued") ||
          (certificate.status === a.status && (certificate.issueDate ?? "") > (a.issueDate ?? "")));
      if (!better) continue;
    }

    byPair.set(pairKey, {
      programKey,
      groupKey,
      program: {
        id: programKey,
        name: r.course_name || "Без названия программы",
        code: r.course_code,
        hours: r.course_hours,
      },
      group: {
        id: groupKey,
        code: r.group_code || "—",
        startDate: r.start_date,
        endDate: r.end_date,
        status,
      },
      student: {
        id: r.student_id,
        fullName: r.full_name,
        pinfl: r.pinfl,
        position: r.position,
        department: r.department,
        state,
        certificate,
      },
    });
  }

  const all = [...byPair.values()];
  const yearOf = (e: Enrollment) => {
    const d = e.group.startDate ?? e.student.certificate?.issueDate;
    return d ? Number(d.slice(0, 4)) : null;
  };
  const years = [...new Set(all.map(yearOf).filter((y): y is number => y !== null))].sort(
    (a, b) => b - a,
  );
  const enrollments = year ? all.filter((e) => yearOf(e) === year) : all;

  // Программа → группа → слушатели
  const programMap = new Map<string, { info: Enrollment["program"]; groups: Map<string, Enrollment[]> }>();
  for (const e of enrollments) {
    let p = programMap.get(e.programKey);
    if (!p) {
      p = { info: e.program, groups: new Map() };
      programMap.set(e.programKey, p);
    }
    const list = p.groups.get(e.groupKey);
    if (list) list.push(e);
    else p.groups.set(e.groupKey, [e]);
  }

  const minDate = (dates: (string | null)[]) =>
    dates.filter((d): d is string => !!d).sort()[0] ?? null;
  const maxDate = (dates: (string | null)[]) =>
    dates.filter((d): d is string => !!d).sort().at(-1) ?? null;

  const programs: TrainingProgram[] = [...programMap.values()].map(({ info, groups }) => {
    const groupList: TrainingGroup[] = [...groups.values()]
      .map((items) => ({
        ...items[0]!.group,
        counts: countEnrollments(items),
        certificateNames: certificateNamesOf(items),
        students: items
          .map((e) => e.student)
          .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru")),
      }))
      .sort(
        (a, b) =>
          (a.startDate ?? "").localeCompare(b.startDate ?? "") || a.code.localeCompare(b.code, "ru"),
      );
    const items = [...groups.values()].flat();
    return {
      ...info,
      counts: countEnrollments(items),
      certificateNames: certificateNamesOf(items),
      firstDate: minDate(groupList.map((g) => g.startDate)),
      lastDate: maxDate(groupList.map((g) => g.endDate)),
      groups: groupList,
    };
  });

  programs.sort(
    (a, b) => b.counts.students - a.counts.students || a.name.localeCompare(b.name, "ru"),
  );

  const groupCount = programs.reduce((n, p) => n + p.groups.length, 0);

  return {
    organization: { id: org.id, name: org.name, code: org.code, inn: org.inn ?? null },
    year,
    years,
    employees: Number(org.employees) || 0,
    summary: {
      ...countEnrollments(enrollments),
      programs: programs.length,
      groups: groupCount,
      firstDate: minDate(programs.map((p) => p.firstDate)),
      lastDate: maxDate(programs.map((p) => p.lastDate)),
    },
    programs,
  };
}

// ============================================================================
// EXCEL
// ============================================================================

const FONT = "Calibri";
const COLOR = {
  brand: "FF3641F5",
  brandSoft: "FFECF3FF",
  header: "FF1D2939",
  text: "FF101828",
  muted: "FF667085",
  border: "FFD0D5DD",
  zebra: "FFF9FAFB",
  success: "FF027A48",
  successSoft: "FFECFDF3",
  warning: "FFB54708",
  warningSoft: "FFFFFAEB",
  info: "FF026AA2",
  infoSoft: "FFF0F9FF",
  danger: "FFB42318",
  dangerSoft: "FFFEF3F2",
} as const;

const GROUP_STATUS_LABEL: Record<GroupStatus, string> = {
  planned: "Запланирована",
  active: "Идёт обучение",
  completed: "Завершена",
};

const dmy = (ymd: string | null) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
};

/** Дата для ячейки Excel (как настоящая дата, чтобы работали сортировка и фильтры) */
const excelDate = (ymd: string | null) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
};

const percent = (part: number, total: number) => (total ? part / total : 0);

const thin = (argb: string = COLOR.border) => ({ style: "thin" as const, color: { argb } });

const studentStatus = (s: TrainingStudent, g: GroupStatus) => {
  if (s.state === "certified") return { text: "Сертификат выдан", color: COLOR.success, fill: COLOR.successSoft };
  if (s.certificate?.status === "revoked") return { text: "Сертификат отозван", color: COLOR.danger, fill: COLOR.dangerSoft };
  if (s.state === "no_certificate") return { text: "Сертификат не выдан", color: COLOR.warning, fill: COLOR.warningSoft };
  return g === "planned"
    ? { text: "Зачислен (группа не началась)", color: COLOR.info, fill: COLOR.infoSoft }
    : { text: "Проходит обучение", color: COLOR.info, fill: COLOR.infoSoft };
};

interface Column {
  header: string;
  width: number;
  /** Формат числа/даты */
  numFmt?: string;
  align?: "left" | "center" | "right";
  wrap?: boolean;
}

/**
 * Сколько строк займёт текст в ячейке с переносом по словам. ExcelJS не подбирает высоту строк
 * сам, а Excel при открытии делает это не всегда, поэтому высоту ставим явно.
 * Ширина колонки — в «символах»; ПРОПИСНЫЕ буквы шире строчных.
 */
const wrappedLines = (text: string, width: number, bold = false) => {
  const letters = text.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  const upperShare = letters.length ? letters.replace(/[^A-ZА-ЯЁ]/g, "").length / letters.length : 0;
  const perLine = Math.max(1, Math.floor((width - 1) * (upperShare > 0.5 ? 0.85 : 1.1) * (bold ? 0.92 : 1)));
  let lines = 1;
  let current = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current === 0) current = word.length;
    else if (current + 1 + word.length <= perLine) current += 1 + word.length;
    else {
      lines++;
      current = word.length;
    }
    while (current > perLine) {
      lines++;
      current -= perLine;
    }
  }
  return lines;
};

/** Высота строки (pt) для шрифта 10 pt */
const rowHeightFor = (lines: number) => Math.max(18, lines * 13 + 5);

/** Таблица с шапкой: заголовки, ширины, автофильтр, закрепление шапки */
function writeTable(
  ws: ExcelJS.Worksheet,
  startRow: number,
  columns: Column[],
  rows: (string | number | Date | null)[][],
  options: {
    /** Автофильтр и закреплённая шапка (для длинных списков) */
    filterable?: boolean;
    styleRow?: (row: ExcelJS.Row, index: number) => void;
  } = {},
) {
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  const head = ws.getRow(startRow);
  head.values = columns.map((c) => c.header);
  head.height = rowHeightFor(Math.max(2, ...columns.map((c) => wrappedLines(c.header, c.width, true))));
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
    row.height = rowHeightFor(lines);
    columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      cell.font = { name: FONT, size: 10, color: { argb: COLOR.text } };
      cell.alignment = {
        vertical: "middle",
        horizontal: c.align ?? "left",
        wrapText: c.wrap ?? false,
      };
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.border = { top: thin(), bottom: thin(), left: thin(), right: thin() };
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.zebra } };
      }
    });
    options.styleRow?.(row, index);
  });

  if (options.filterable !== false) {
    if (rows.length) {
      ws.autoFilter = {
        from: { row: startRow, column: 1 },
        to: { row: startRow + rows.length, column: columns.length },
      };
    }
    ws.views = [{ state: "frozen", ySplit: startRow, xSplit: 0 }];
  }
}

/** Шапка листа: название отчёта, организация, период */
function writeSheetTitle(ws: ExcelJS.Worksheet, model: OrganizationTraining, title: string, span: number) {
  const periodText = model.year ? `${model.year} год (по дате начала группы)` : "за всё время";
  const now = new Date();
  const generated = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  ws.mergeCells(1, 1, 1, span);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: FONT, size: 15, bold: true, color: { argb: COLOR.brand } };
  ws.getRow(1).height = 24;

  ws.mergeCells(2, 1, 2, span);
  const o = ws.getCell(2, 1);
  o.value = model.organization.name + (model.organization.inn ? `  ·  ИНН ${model.organization.inn}` : "");
  o.font = { name: FONT, size: 12, bold: true, color: { argb: COLOR.text } };

  ws.mergeCells(3, 1, 3, span);
  const p = ws.getCell(3, 1);
  p.value = `Период: ${periodText}  ·  Сформирован: ${generated}`;
  p.font = { name: FONT, size: 10, color: { argb: COLOR.muted } };
}

export async function buildOrganizationTrainingWorkbook(model: OrganizationTraining): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ATC Platform";
  wb.created = new Date();

  // ---------------------------------------------------------------- Сводка
  {
    const ws = wb.addWorksheet("Сводка по программам", {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    const columns: Column[] = [
      { header: "№", width: 5, align: "center" },
      { header: "Программа обучения", width: 60, wrap: true },
      { header: "Код", width: 10, align: "center" },
      { header: "Часов", width: 8, align: "center" },
      { header: "Групп", width: 8, align: "center" },
      { header: "Обучено слушателей", width: 12, align: "center" },
      { header: "Получили сертификат", width: 12, align: "center" },
      { header: "Сертификат не выдан", width: 12, align: "center" },
      { header: "Проходят обучение", width: 12, align: "center" },
      { header: "% с сертификатом", width: 14, align: "center", numFmt: "0%" },
      { header: "Выданные сертификаты", width: 24, wrap: true },
      { header: "Период обучения", width: 24, align: "center" },
    ];
    writeSheetTitle(ws, model, "Отчёт об обучении сотрудников", columns.length);

    // Ключевые показатели
    const s = model.summary;
    const kpis: [string, string | number][] = [
      ["Сотрудников в базе", model.employees],
      ["Прошли обучение (слушателей)", s.students],
      ["Получили сертификат", `${s.certified}  (${Math.round(percent(s.certified, s.students) * 100)}%)`],
      ["Выдано сертификатов", s.certificates],
      ["Программ обучения", s.programs],
      ["Учебных групп", s.groups],
    ];
    kpis.forEach(([label, value], i) => {
      const row = ws.getRow(5 + i);
      const l = row.getCell(2);
      l.value = label;
      l.font = { name: FONT, size: 10, color: { argb: COLOR.muted } };
      l.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brandSoft } };
      l.border = { top: thin(), bottom: thin(), left: thin() };
      const v = row.getCell(3);
      v.value = value;
      v.font = { name: FONT, size: 11, bold: true, color: { argb: COLOR.text } };
      v.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brandSoft } };
      v.alignment = { horizontal: "left" };
      v.border = { top: thin(), bottom: thin(), right: thin() };
      ws.mergeCells(5 + i, 3, 5 + i, 4);
    });

    const tableStart = 5 + kpis.length + 1;
    const rows = model.programs.map((p, i) => [
      i + 1,
      p.name,
      p.code ?? "",
      p.hours ?? "",
      p.groups.length,
      p.counts.students,
      p.counts.certified,
      p.counts.noCertificate,
      p.counts.inTraining,
      percent(p.counts.certified, p.counts.students),
      p.certificateNames.join(", "),
      p.firstDate ? `${dmy(p.firstDate)} – ${dmy(p.lastDate)}` : "",
    ]);
    writeTable(ws, tableStart, columns, rows, {
      filterable: false,
      styleRow: (row) => {
        row.getCell(7).font = { name: FONT, size: 10, bold: true, color: { argb: COLOR.success } };
      },
    });

    // Итог
    const total = ws.getRow(tableStart + rows.length + 1);
    total.values = [
      "",
      "Итого",
      "",
      "",
      s.groups,
      s.students,
      s.certified,
      s.noCertificate,
      s.inTraining,
      percent(s.certified, s.students),
      "",
      s.firstDate ? `${dmy(s.firstDate)} – ${dmy(s.lastDate)}` : "",
    ];
    total.eachCell({ includeEmpty: true }, (cell, col) => {
      if (col > columns.length) return;
      cell.font = { name: FONT, size: 10, bold: true, color: { argb: COLOR.text } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.brandSoft } };
      cell.border = { top: thin(COLOR.brand), bottom: thin(COLOR.brand), left: thin(), right: thin() };
      cell.alignment = { vertical: "middle", horizontal: col === 2 ? "left" : "center" };
      if (col === 10) cell.numFmt = "0%";
    });
  }

  // ---------------------------------------------------------------- Группы
  {
    const ws = wb.addWorksheet("Группы", {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    const columns: Column[] = [
      { header: "№", width: 5, align: "center" },
      { header: "Программа обучения", width: 55, wrap: true },
      { header: "Код программы", width: 11, align: "center" },
      { header: "Группа", width: 18, align: "center" },
      { header: "Дата начала", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Дата окончания", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Статус группы", width: 16, align: "center" },
      { header: "Слушателей", width: 11, align: "center" },
      { header: "Получили сертификат", width: 12, align: "center" },
      { header: "Сертификат не выдан", width: 12, align: "center" },
      { header: "Проходят обучение", width: 12, align: "center" },
      { header: "Выданные сертификаты", width: 24, wrap: true },
    ];
    writeSheetTitle(ws, model, "Учебные группы", columns.length);

    const groups = model.programs.flatMap((p) => p.groups.map((g) => ({ p, g })));
    const rows = groups.map(({ p, g }, i) => [
      i + 1,
      p.name,
      p.code ?? "",
      g.code,
      excelDate(g.startDate),
      excelDate(g.endDate),
      GROUP_STATUS_LABEL[g.status],
      g.counts.students,
      g.counts.certified,
      g.counts.noCertificate,
      g.counts.inTraining,
      g.certificateNames.join(", "),
    ]);
    writeTable(ws, 5, columns, rows, {
      styleRow: (row, i) => {
        const status = groups[i]!.g.status;
        const c = row.getCell(7);
        const color = status === "completed" ? COLOR.success : status === "active" ? COLOR.info : COLOR.muted;
        c.font = { name: FONT, size: 10, bold: true, color: { argb: color } };
        row.getCell(4).font = { name: FONT, size: 10, bold: true, color: { argb: COLOR.text } };
      },
    });
  }

  // ---------------------------------------------------------------- Слушатели
  {
    const ws = wb.addWorksheet("Слушатели и сертификаты", {
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    const columns: Column[] = [
      { header: "№", width: 6, align: "center" },
      { header: "ФИО слушателя", width: 34, wrap: true },
      { header: "ПИНФЛ", width: 17, align: "center" },
      { header: "Должность", width: 28, wrap: true },
      { header: "Подразделение", width: 24, wrap: true },
      { header: "Программа обучения", width: 45 },
      { header: "Код программы", width: 11, align: "center" },
      { header: "Группа", width: 16, align: "center" },
      { header: "Дата начала", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Дата окончания", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Название сертификата", width: 18, align: "center" },
      { header: "№ сертификата", width: 20, align: "center" },
      { header: "Дата выдачи", width: 12, align: "center", numFmt: "dd.mm.yyyy" },
      { header: "Статус", width: 22, align: "center" },
    ];
    writeSheetTitle(ws, model, "Слушатели и выданные сертификаты", columns.length);

    const items = model.programs.flatMap((p) =>
      p.groups.flatMap((g) => g.students.map((s) => ({ p, g, s }))),
    );
    const rows = items.map(({ p, g, s }, i) => [
      i + 1,
      s.fullName,
      s.pinfl,
      s.position,
      s.department ?? "",
      p.name,
      p.code ?? "",
      g.code,
      excelDate(g.startDate),
      excelDate(g.endDate),
      s.certificate?.name ?? "",
      s.certificate?.number ?? "",
      excelDate(s.certificate?.issueDate ?? null),
      studentStatus(s, g.status).text,
    ]);
    writeTable(ws, 5, columns, rows, {
      styleRow: (row, i) => {
        const { s, g } = items[i]!;
        const st = studentStatus(s, g.status);
        const c = row.getCell(14);
        c.font = { name: FONT, size: 10, bold: true, color: { argb: st.color } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: st.fill } };
        if (s.certificate?.name) {
          row.getCell(11).font = { name: FONT, size: 10, bold: true, color: { argb: COLOR.brand } };
        }
        // ПИНФЛ — как текст, чтобы Excel не превращал его в число
        row.getCell(3).numFmt = "@";
      },
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
