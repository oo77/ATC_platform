/**
 * «Пустой журнал» учебной группы — бланк для ручного заполнения на занятиях.
 *
 * Word собирается из утверждённого шаблона server/assets/templates/journal-template.docx.
 * Шаблон правится «на месте» (pizzip + XML), поэтому шрифты, рамки, ширины колонок,
 * поворот дат, автонумерация и титульный лист остаются ровно такими, как в шаблоне.
 * Подставляются только поля, помеченные в шаблоне жёлтым маркером: код группы, даты курса,
 * название курса (на узбекском, если оно задано в карточке программы), даты в шапке таблицы,
 * ФИО слушателей и инструкторы — те из инструкторов группы, кого пользователь оставил
 * при скачивании (см. loadEmptyJournalInstructors).
 * (Маркер в готовом файле убирается, подчёркивание и начертание сохраняются.)
 *
 * PDF-версия того же бланка — в emptyJournalPdfService.ts.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "journal-template.docx",
);

/** Число колонок дат в таблице бланка (как в шаблоне) */
export const JOURNAL_DATE_COLUMNS = 13;

/** Защита от ошибочных дат группы: больше стольких дней подряд в колонки не берём */
const MAX_COURSE_DAYS = 366;

/**
 * В строке «Instruktor F.I.Sh: … Imzo: ____» слово «Imzo» стоит на десятом стандартном шаге
 * табуляции (10 × 708 twips от левого поля), как в шаблоне
 */
const INSTRUCTOR_IMZO_TWIPS = 10 * 708;

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface EmptyJournalModel {
  groupCode: string;
  courseName: string;
  /** Как в бланке: «17.09-19.09.2026» */
  courseDates: string;
  /** Год для титульного листа («Toshkent-2026») — год начала курса */
  year: string;
  /** «Фамилия Имя» слушателей в алфавитном порядке (как в шаблоне) */
  students: string[];
  /**
   * «Фамилия И.» выбранных инструкторов — у каждого своя строка «Instruktor F.I.Sh: … Imzo: ____»;
   * пусто — одна строка с линией для рукописного ввода
   */
  instructors: string[];
  /** Все колонки дат вида «17.09», по возрастанию (см. buildDateColumns) */
  dates: string[];
}

/** Инструктор группы — для выбора перед скачиванием журнала */
export interface EmptyJournalInstructor {
  id: string;
  fullName: string;
  /** Как он будет записан в бланке: «Rasulov K.» */
  shortName: string;
}

interface GroupRow extends RowDataPacket {
  code: string;
  course_name: string | null;
  course_name_uz: string | null;
  start_date: string;
  end_date: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

/** «17.09-19.09.2026»; один день — «17.09.2026»; через границу года — обе даты полностью */
export function formatCourseDates(startYmd: string, endYmd: string): string {
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  const full = (x: { y: number; m: number; d: number }) =>
    `${pad2(x.d)}.${pad2(x.m)}.${x.y}`;

  if (startYmd === endYmd) return full(s);
  if (s.y === e.y) return `${pad2(s.d)}.${pad2(s.m)}-${pad2(e.d)}.${pad2(e.m)}.${e.y}`;
  return `${full(s)}-${full(e)}`;
}

/**
 * Колонки дат «DD.MM»: все дни курса, кроме воскресений, плюс дни с занятиями в расписании
 * (в том числе воскресные и выпавшие за срок курса). Расписание может быть заполнено не до конца,
 * поэтому даты не берутся из него одного: лишняя колонка безобиднее пропавшей.
 */
function buildDateColumns(
  startYmd: string,
  endYmd: string,
  scheduledYmd: string[],
): string[] {
  const days = new Set(scheduledYmd);
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  const cursor = new Date(Date.UTC(s.y, s.m - 1, s.d));
  const last = Date.UTC(e.y, e.m - 1, e.d);

  for (let i = 0; cursor.getTime() <= last && i < MAX_COURSE_DAYS; i++) {
    if (cursor.getUTCDay() !== 0) {
      days.add(
        `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}-${pad2(cursor.getUTCDate())}`,
      );
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return [...days].sort().map((ymd) => {
    const { m, d } = parseYmd(ymd);
    return `${pad2(d)}.${pad2(m)}`;
  });
}

/** «AHADOV SARVAR ATOYEVICH» → «Ahadov Sarvar»: как в шаблоне — фамилия и имя, с заглавной буквы */
export function formatPersonName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ")
    .toLocaleLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase());
}

/** «RASULOV KAMOL ABDUXALIKOVICH» → «Rasulov K.» (как «Agzamov M.» в бланке) */
export function shortPersonName(fullName: string): string {
  const [surname = "", name = ""] = fullName.trim().split(/\s+/);
  const initial = Array.from(name)[0];
  const formattedSurname = formatPersonName(surname);
  return initial ? `${formattedSurname} ${initial.toLocaleUpperCase()}.` : formattedSurname;
}

export function chunk<T>(list: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages.length > 0 ? pages : [[]];
}

/** Инструкторы, которые ведут занятия группы по расписанию, — в порядке первого занятия */
export async function loadEmptyJournalInstructors(
  groupId: string,
): Promise<EmptyJournalInstructor[]> {
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT i.id, i.full_name
     FROM schedule_events se
     JOIN instructors i ON i.id = se.instructor_id
     WHERE se.group_id = ?
     GROUP BY i.id, i.full_name
     ORDER BY MIN(se.start_time), i.full_name`,
    [groupId],
  );
  return rows
    .map((r) => {
      const fullName = String(r.full_name ?? "").replace(/\s+/g, " ").trim();
      return { id: String(r.id), fullName, shortName: shortPersonName(fullName) };
    })
    .filter((instructor) => instructor.shortName);
}

/**
 * Собирает данные бланка. null — группа не найдена.
 * instructorIds — инструкторы группы, которых пользователь оставил при скачивании
 * (остальные и посторонние id в бланк не попадают).
 */
export async function loadEmptyJournalModel(
  groupId: string,
  instructorIds: string[],
): Promise<EmptyJournalModel | null> {
  const groupRows = await executeQuery<GroupRow[]>(
    `SELECT g.code,
            c.name AS course_name,
            c.name_uz AS course_name_uz,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') AS end_date
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = groupRows[0];
  if (!group) return null;

  const [studentRows, dateRows, instructors] = await Promise.all([
    executeQuery<RowDataPacket[]>(
      `SELECT s.full_name
       FROM study_group_students sgs
       JOIN students s ON s.id = sgs.student_id
       WHERE sgs.group_id = ?
       ORDER BY s.full_name`,
      [groupId],
    ),
    executeQuery<RowDataPacket[]>(
      `SELECT DISTINCT DATE_FORMAT(start_time, '%Y-%m-%d') AS day
       FROM schedule_events
       WHERE group_id = ?
       ORDER BY day`,
      [groupId],
    ),
    loadEmptyJournalInstructors(groupId),
  ]);

  return {
    groupCode: group.code,
    // Название программы на узбекском, а если оно не заполнено — основное
    courseName: group.course_name_uz?.trim() || group.course_name || "",
    courseDates: formatCourseDates(group.start_date, group.end_date),
    year: String(parseYmd(group.start_date).y),
    students: studentRows
      .map((r) => formatPersonName(String(r.full_name ?? "")))
      .filter(Boolean),
    instructors: instructors
      .filter((instructor) => instructorIds.includes(instructor.id))
      .map((instructor) => instructor.shortName),
    dates: buildDateColumns(
      group.start_date,
      group.end_date,
      dateRows.map((r) => String(r.day)),
    ),
  };
}

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
const PARA_RE = /<w:p(?=[ >])[^>]*?(?<!\/)>[\s\S]*?<\/w:p>/g;
const ROW_RE = /<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g;
const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;

/** Номер колонки (в строке с датами) первой ячейки с датой: № | ФИО | «Sana» | даты… */
const FIRST_DATE_CELL = 3;

function templateError(problem: string): Error {
  return new Error(
    `Шаблон журнала (journal-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textOf(xml: string): string {
  return [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("");
}

const rPrOf = (run: string) => /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] ?? "";
const pPrOf = (xml: string) => /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(xml)?.[0] ?? "";
const withoutHighlight = (rPr: string) => rPr.replace(/<w:highlight [^>]*\/>/g, "");
const withoutUnderline = (rPr: string) => rPr.replace(/<w:u [^>]*\/>/g, "");

const makeRun = (rPr: string, text: string) =>
  `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

interface FieldValue {
  text: string;
  /** Пустое поле: вместо значения — линия «____», без подчёркивания */
  blank?: boolean;
}

/**
 * Подставляет значения в «жёлтые» поля: каждая группа подряд идущих ранов с маркером
 * заменяется одним раном (формат первого рана, без маркера).
 */
function fillMarkedFields(xml: string, values: FieldValue[], where: string): string {
  let group = -1;
  let inGroup = false;

  const result = xml.replace(RUN_RE, (run) => {
    if (!/<w:highlight\b/.test(run)) {
      inGroup = false;
      return run;
    }
    if (inGroup) return ""; // остальные раны того же поля

    inGroup = true;
    group += 1;
    const value = values[group];
    if (!value) return run;

    let rPr = withoutHighlight(rPrOf(run));
    if (value.blank) rPr = withoutUnderline(rPr);
    return makeRun(rPr, value.text);
  });

  if (group + 1 !== values.length) {
    throw templateError(
      `в «${where}» найдено полей с маркером: ${group + 1}, ожидалось ${values.length}`,
    );
  }
  // Маркер может стоять и на знаке абзаца (pPr/rPr) — убираем и его
  return result.replace(/<w:highlight [^>]*\/>/g, "");
}

/** Заменяет ячейки строки (по порядку) результатом fn */
function mapCells(row: string, fn: (cell: string, index: number) => string): string {
  let i = -1;
  return row.replace(CELL_RE, (cell) => fn(cell, ++i));
}

/** Ячейка с датой: повёрнутый текст, формат как у заполненных дат шаблона */
function makeDateCell(
  cell: string,
  date: string | null,
  proto: { filledPPr: string; emptyPPr: string; runRPr: string },
): string {
  const tcPr = /<w:tcPr>[\s\S]*?<\/w:tcPr>/.exec(cell)?.[0] ?? "";
  const baseTcPr = tcPr.replace(/<w:vAlign [^>]*\/>/g, "");
  // По схеме OOXML vAlign идёт перед hideMark, а hideMark — последним в tcPr
  const newTcPr = date
    ? baseTcPr
    : baseTcPr.replace(/(<w:hideMark\/>)?<\/w:tcPr>/, '<w:vAlign w:val="center"/>$1</w:tcPr>');

  const paragraph = date
    ? `<w:p>${proto.filledPPr}${makeRun(proto.runRPr, date)}</w:p>`
    : `<w:p>${proto.emptyPPr}</w:p>`;

  return `<w:tc>${newTcPr}${paragraph}</w:tc>`;
}

/** Шапка таблицы повторяется на следующих страницах, если слушателей больше, чем помещается */
const markAsHeaderRow = (row: string) =>
  row.replace(/(<w:trHeight [^>]*\/>)/, "$1<w:tblHeader/>");

function renderTable(
  table: string,
  students: string[],
  dates: string[],
  numId: number,
): string {
  const rows = table.match(ROW_RE);
  if (!rows || rows.length < 3) {
    throw templateError("в таблице меньше трёх строк (шапка, даты, слушатель)");
  }
  const [captionRow, dateRow, studentProto] = rows as [string, string, string];
  const tableHead = table.slice(0, table.indexOf(captionRow));

  // --- строка с датами ---
  const dateCells = dateRow.match(CELL_RE) ?? [];
  if (dateCells.length - FIRST_DATE_CELL !== JOURNAL_DATE_COLUMNS) {
    throw templateError(
      `в строке дат ${dateCells.length - FIRST_DATE_CELL} колонок, ожидалось ${JOURNAL_DATE_COLUMNS}`,
    );
  }
  const filledCell = dateCells[FIRST_DATE_CELL]!;
  const emptyCell = dateCells.find(
    (c, i) => i >= FIRST_DATE_CELL && !/<w:t[ >]/.test(c),
  );
  const proto = {
    filledPPr: pPrOf(filledCell),
    emptyPPr: pPrOf(emptyCell ?? filledCell),
    runRPr: withoutHighlight(rPrOf(/<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/.exec(filledCell)?.[0] ?? "")),
  };
  const newDateRow = mapCells(dateRow, (cell, i) =>
    i < FIRST_DATE_CELL
      ? cell
      : makeDateCell(cell, dates[i - FIRST_DATE_CELL] ?? null, proto),
  );

  // --- строки слушателей: по образцу первой строки шаблона ---
  const studentRows = students.map((name) => {
    const row = mapCells(studentProto, (cell, i) =>
      i === 1 ? fillMarkedFields(cell, [{ text: name }], "ФИО слушателя") : cell,
    );
    return row.replace(/(<w:numId w:val=")\d+("\/>)/, `$1${numId}$2`);
  });

  return (
    tableHead +
    markAsHeaderRow(captionRow) +
    markAsHeaderRow(newDateRow) +
    studentRows.join("") +
    "</w:tbl>"
  );
}

/**
 * Хвост из «_» после кода группы: короче код — длиннее линия, чтобы строка не «плыла»
 * (в шаблоне после «KSR-12PK» стоит 12 подчёркиваний)
 */
export const groupCodeTail = (groupCode: string) =>
  "_".repeat(Math.max(2, 20 - Array.from(groupCode).length));

/** Строка вида «Guruh: ____KSR-12PK____ … Kurs sanasi: ____17.09-19.09.2026____» */
function renderGroupLine(p: string, model: EmptyJournalModel): string {
  const filled = fillMarkedFields(
    p,
    [{ text: model.groupCode }, { text: model.courseDates }],
    "Guruh / Kurs sanasi",
  );
  const tail = groupCodeTail(model.groupCode);
  return filled.replace(
    /(<w:t(?: [^>]*)?>)_{6,}(<\/w:t>)(?=(?:(?!<w:t[ >])[\s\S])*<w:tab\/>)/,
    `$1${tail}$2`,
  );
}

/**
 * Строки «Instruktor F.I.Sh: … Imzo: ____» — своя у каждого инструктора (абзац шаблона
 * повторяется); без инструкторов — одна, с линией вместо фамилии.
 *
 * В шаблоне «Imzo» отодвинут пятью табуляциями со стандартным шагом, и после фамилии длиннее
 * образца он уехал бы за край строки. Поэтому абзацу задаётся позиция табуляции там, где
 * «Imzo» стоит в шаблоне, и остаётся одна табуляция: «Imzo» во всех строках на одном месте.
 */
function renderInstructorLines(p: string, instructors: string[]): string {
  const tabRuns = [...p.matchAll(RUN_RE)].filter((run) => run[0].includes("<w:tab/>"));
  const firstTab = tabRuns[0];
  const lastTab = tabRuns[tabRuns.length - 1];
  if (!firstTab || !lastTab || textOf(p.slice(firstTab.index, lastTab.index)).trim()) {
    throw templateError("в строке «Instruktor F.I.Sh» между ФИО и «Imzo» ожидались табуляции");
  }
  const lineTpl = (p.slice(0, firstTab.index) + p.slice(lastTab.index)).replace(
    // По схеме OOXML tabs идёт в pPr после pStyle/keepNext/keepLines/pageBreakBefore
    /(<w:pPr>(?:<w:pStyle [^>]*\/>)?(?:<w:keepNext\/>)?(?:<w:keepLines\/>)?(?:<w:pageBreakBefore\/>)?)/,
    `$1<w:tabs><w:tab w:val="left" w:pos="${INSTRUCTOR_IMZO_TWIPS}"/></w:tabs>`,
  );

  const names: FieldValue[] =
    instructors.length > 0
      ? instructors.map((text) => ({ text }))
      : [{ text: "________________", blank: true }];
  return names
    .map((name) => fillMarkedFields(lineTpl, [name], "Instruktor F.I.Sh"))
    .join("");
}

function renderPage(
  blockTpl: string,
  model: EmptyJournalModel,
  pageDates: string[],
  pageIndex: number,
  numId: number,
): string {
  const tableStart = blockTpl.indexOf("<w:tbl>");
  const tableEnd = blockTpl.indexOf("</w:tbl>") + "</w:tbl>".length;
  const pre = blockTpl.slice(0, tableStart);
  const table = blockTpl.slice(tableStart, tableEnd);
  const post = blockTpl.slice(tableEnd);

  let renderedPre = pre.replace(PARA_RE, (p) => {
    const text = textOf(p);
    if (text.startsWith("Guruh")) return renderGroupLine(p, model);
    if (text.startsWith("Kurs nomi")) {
      return fillMarkedFields(
        p,
        [
          model.courseName
            ? { text: model.courseName }
            : { text: "________________", blank: true },
        ],
        "Kurs nomi",
      );
    }
    return p;
  });

  // Каждая следующая страница журнала — с новой страницы
  if (pageIndex > 0) {
    renderedPre = renderedPre.replace(
      /(<w:pPr>(?:<w:pStyle [^>]*\/>)?(?:<w:keepNext\/>)?(?:<w:keepLines\/>)?)/,
      "$1<w:pageBreakBefore/>",
    );
  }

  const renderedPost = post.replace(PARA_RE, (p) =>
    textOf(p).startsWith("Instruktor") ? renderInstructorLines(p, model.instructors) : p,
  );

  return (
    renderedPre +
    renderTable(table, model.students, pageDates, numId) +
    renderedPost
  );
}

/** Год на титульном листе. В шаблоне «Toshkent-202» и «6» — разные раны (между ними рамка) */
function fillCoverYear(xml: string, year: string): string {
  const split =
    /(<w:t(?: [^>]*)?>)Toshkent-202(<\/w:t>)([\s\S]*?<w:t(?: [^>]*)?>)6(<\/w:t>)/;
  if (split.test(xml)) {
    return xml.replace(
      split,
      (_m, a, b, c, d) => `${a}Toshkent-${year.slice(0, 3)}${b}${c}${year.slice(3)}${d}`,
    );
  }
  return xml.replace(/Toshkent-\d{4}/, `Toshkent-${year}`);
}

export async function renderEmptyJournalDocx(
  model: EmptyJournalModel,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  const numberingFile = zip.file("word/numbering.xml");
  if (!docFile || !numberingFile) {
    throw templateError("нет word/document.xml или word/numbering.xml");
  }

  // Служебные метки Word (проверка орфографии, идентификаторы абзацев) — не нужны,
  // а идентификаторы после размножения строк стали бы неуникальными
  let xml = docFile
    .asText()
    .replace(/<w:proofErr [^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "")
    .replace(/ w14:(?:paraId|textId)="[^"]*"/g, "");
  let numbering = numberingFile.asText();

  // --- страница журнала: от строки «Guruh…» до строки «Instruktor…» ---
  const tableStart = xml.indexOf("<w:tbl>");
  const tableEnd = xml.indexOf("</w:tbl>") + "</w:tbl>".length;
  if (tableStart < 0 || xml.indexOf("<w:tbl>", tableStart + 1) >= 0) {
    throw templateError("ожидалась ровно одна таблица");
  }
  const groupPara = [...xml.slice(0, tableStart).matchAll(PARA_RE)].find((m) =>
    textOf(m[0]).startsWith("Guruh"),
  );
  const instructorPara = [...xml.slice(tableEnd).matchAll(PARA_RE)].find((m) =>
    textOf(m[0]).startsWith("Instruktor"),
  );
  if (!groupPara || !instructorPara) {
    throw templateError("не найдены строки «Guruh…» и «Instruktor F.I.Sh…»");
  }
  const blockStart = groupPara.index!;
  const blockEnd = tableEnd + instructorPara.index! + instructorPara[0].length;
  const blockTpl = xml.slice(blockStart, blockEnd);

  // --- нумерация слушателей: «1., 2., …» — автосписком, на каждой странице с единицы ---
  const templateNumId = Number(/<w:numId w:val="(\d+)"/.exec(blockTpl)?.[1]);
  const numDef = new RegExp(
    `<w:num w:numId="${templateNumId}"[^>]*>\\s*<w:abstractNumId w:val="(\\d+)"`,
  ).exec(numbering);
  if (!templateNumId || !numDef) {
    throw templateError("у слушателей не найден автосписок нумерации");
  }
  const abstractNumId = numDef[1];
  const maxNumId = Math.max(
    ...[...numbering.matchAll(/<w:num w:numId="(\d+)"/g)].map((m) => Number(m[1])),
  );

  const pages = chunk(model.dates, JOURNAL_DATE_COLUMNS);
  const newNums: string[] = [];
  const renderedPages = pages.map((pageDates, i) => {
    let numId = templateNumId;
    if (i > 0) {
      numId = maxNumId + i;
      newNums.push(
        `<w:num w:numId="${numId}"><w:abstractNumId w:val="${abstractNumId}"/>` +
          `<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`,
      );
    }
    return renderPage(blockTpl, model, pageDates, i, numId);
  });

  if (newNums.length > 0) {
    const lastNumEnd = numbering.lastIndexOf("</w:num>") + "</w:num>".length;
    numbering =
      numbering.slice(0, lastNumEnd) + newNums.join("") + numbering.slice(lastNumEnd);
  }

  xml = fillCoverYear(
    xml.slice(0, blockStart) + renderedPages.join("") + xml.slice(blockEnd),
    model.year,
  );

  zip.file("word/document.xml", xml);
  zip.file("word/numbering.xml", numbering);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
