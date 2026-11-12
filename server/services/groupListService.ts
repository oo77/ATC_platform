/**
 * «Список группы» — бланк таблицы слушателей группы (Ф.И.О., год рождения, образование,
 * должность, аэропорт, телефон, образец подписи) по образцу «Таблица, список группы.docx».
 *
 * Собирается из шаблона server/assets/templates/group-list-template.docx правкой XML
 * «на месте» (pizzip), как «Лист ознакомления» (см. acquaintanceSheetService.ts).
 * Подставляются из базы:
 *  - «Список группы №» — код группы;
 *  - «Дата обучения курса с … по …» — даты начала и окончания обучения группы;
 *  - строка «Образец» — Ф.И.О. выбранного инструктора (латиницей) и должность «Инструктор»;
 *  - строки 1…N — Ф.И.О. слушателей (латиницей, как в базе), должность (на русском;
 *    нет перевода — как в базе) и организация в колонке «Аэропорт (АО или ООО)» (название
 *    на русском; не заполнено — основное название). Слушателей больше 20 — строки добавляются.
 * «Курс», год рождения, образование, телефон и подписи заполняются от руки.
 * Размер шрифта и выравнивание значений задаёт шаблон (свойства пустых абзацев в ячейках).
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { formatFullName } from "./evaluationSheetsService";
import { loadEmptyJournalInstructors } from "./emptyJournalService";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "group-list-template.docx",
);

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface GroupListPerson {
  /** «Rasulov Kamol Abduxalikovich» */
  fullName: string;
  /** Должность на русском */
  position: string;
  /** Организация (аэропорт); пусто — ячейка остаётся пустой */
  organization: string;
}

export interface GroupListModel {
  groupCode: string;
  /** Строка «Образец»; null — остаётся пустой */
  instructor: GroupListPerson | null;
  students: GroupListPerson[];
  /** Первый день обучения, ГГГГ-ММ-ДД */
  startDate: string;
  /** Последний день обучения, ГГГГ-ММ-ДД */
  endDate: string;
}

interface GroupRow extends RowDataPacket {
  code: string;
  start_date: string;
  end_date: string;
}

interface StudentRow extends RowDataPacket {
  full_name: string | null;
  position: string | null;
  position_ru: string | null;
  organization: string | null;
  organization_name: string | null;
  organization_name_ru: string | null;
}

const INSTRUCTOR_POSITION = "Инструктор";

/** instructorId не из расписания группы */
export class UnknownInstructorError extends Error {}

const collapseSpaces = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

/**
 * Собирает данные бланка. null — группа не найдена.
 * instructorId — инструктор из расписания группы (см. loadEmptyJournalInstructors) или null;
 * посторонний id — UnknownInstructorError.
 */
export async function loadGroupListModel(
  groupId: string,
  instructorId: string | null,
): Promise<GroupListModel | null> {
  const rows = await executeQuery<GroupRow[]>(
    `SELECT g.code,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') AS end_date
     FROM study_groups g
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = rows[0];
  if (!group) return null;

  let instructor: GroupListPerson | null = null;
  if (instructorId) {
    const found = (await loadEmptyJournalInstructors(groupId)).find(
      (candidate) => candidate.id === instructorId,
    );
    if (!found) throw new UnknownInstructorError("Инструктор не ведёт занятия этой группы");
    instructor = {
      fullName: formatFullName(found.fullName),
      position: INSTRUCTOR_POSITION,
      organization: "",
    };
  }

  const studentRows = await executeQuery<StudentRow[]>(
    `SELECT s.full_name, s.position, s.position_ru, s.organization,
            o.name AS organization_name, o.name_ru AS organization_name_ru
     FROM study_group_students sgs
     JOIN students s ON s.id = sgs.student_id
     LEFT JOIN organizations o ON o.id = s.organization_id
     WHERE sgs.group_id = ?
     ORDER BY s.full_name`,
    [groupId],
  );
  const students = studentRows
    .map((row) => ({
      fullName: formatFullName(row.full_name ?? ""),
      position: collapseSpaces(row.position_ru) || collapseSpaces(row.position),
      organization:
        collapseSpaces(row.organization_name_ru) ||
        collapseSpaces(row.organization_name) ||
        collapseSpaces(row.organization),
    }))
    .filter((student) => student.fullName);

  return {
    groupCode: group.code,
    instructor,
    students,
    startDate: group.start_date,
    endDate: group.end_date,
  };
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «2026-10-27» → { day: "27", month: "октября", year: "2026" } */
function dateParts(ymd: string) {
  const [year, month, day] = ymd.split("-");
  return { day, month: MONTHS_GENITIVE[Number(month) - 1], year };
}

/**
 * «с «27» октября по «31» октября 2026 года.»; если обучение переходит на следующий год —
 * год указывается у обеих дат: «с «28» декабря 2026 года по «05» января 2027 года.»
 */
function formatPeriod(startDate: string, endDate: string): string {
  const start = dateParts(startDate);
  const end = dateParts(endDate);
  const startYear = start.year === end.year ? "" : ` ${start.year} года`;
  return `с «${start.day}» ${start.month}${startYear} по «${end.day}» ${end.month} ${end.year} года.`;
}

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const PARA_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
const TEXT_RE = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;

const TITLE_LABEL = "Список группы";
const PERIOD_LABEL = "Дата обучения курса";

/** «№ _______________» — линия для номера группы */
const GROUP_BLANK_RE = /№\s*_+/;
/** «с «_____» ______ по «_____» _______ 2026 года.» — период обучения до конца строки */
const PERIOD_BLANK_RE = /с «_+»[\s\S]*$/;

function templateError(problem: string): Error {
  return new Error(
    `Шаблон списка группы (group-list-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const textOf = (xml: string) => Array.from(xml.matchAll(TEXT_RE), (m) => m[1]).join("");

/**
 * Абзац, текст которого начинается с label, получает текст fn(текст абзаца) одним раном
 * в формате первого рана абзаца (в шаблоне строка разбита на раны с одинаковым форматом).
 */
function rewriteParagraph(xml: string, label: string, fn: (text: string) => string): string {
  let found = 0;
  const result = xml.replace(PARA_RE, (p) => {
    const text = textOf(p);
    if (!text.trim().startsWith(label)) return p;
    found += 1;
    let first = true;
    return p.replace(RUN_RE, (run) => {
      if (!first) return "";
      first = false;
      return run.replace(TEXT_RE, () => "").replace(
        /<\/w:r>$/,
        `<w:t xml:space="preserve">${escapeXml(fn(text))}</w:t></w:r>`,
      );
    });
  });
  if (found !== 1) throw templateError(`ожидалась одна строка «${label}»`);
  return result;
}

/** text.replace(re, value); если в тексте нет re — ошибка шаблона */
function replaceBlank(text: string, re: RegExp, value: string, where: string): string {
  if (!re.test(text)) throw templateError(`в строке «${where}» нет линии для заполнения`);
  return text.replace(re, () => value);
}

// ---------------------------------------------------------------------------- таблица

const ROW_RE = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;
const SAMPLE_LABEL = "Обра-зец";
/** Колонки таблицы: №, Ф.И.О, год рождения, образование, должность, аэропорт, телефон */
const COLUMN_COUNT = 7;
const FIO_COLUMN = 1;
const POSITION_COLUMN = 4;
const ORGANIZATION_COLUMN = 5;

/** Пустая ячейка шаблона получает текст раном в формате абзаца (rPr из pPr) */
function fillCell(cell: string, value: string): string {
  if (!value) return cell;
  let filled = false;
  const result = cell.replace(PARA_RE, (p) => {
    if (filled) return p;
    const rPr = p.match(/<w:pPr>[\s\S]*?(<w:rPr>[\s\S]*?<\/w:rPr>)[\s\S]*?<\/w:pPr>/)?.[1] ?? "";
    filled = true;
    return p
      .replace(RUN_RE, "")
      .replace(/<\/w:p>$/, `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>`);
  });
  if (!filled) throw templateError("в ячейке таблицы нет абзаца");
  return result;
}

/** Строка таблицы с Ф.И.О., должностью и организацией (остальные ячейки — как в шаблоне) */
function fillRow(row: string, person: GroupListPerson | null, number?: number): string {
  let index = -1;
  return row.replace(CELL_RE, (cell) => {
    index += 1;
    if (number !== undefined && index === 0) {
      cell = cell.replace(TEXT_RE, () => `<w:t>${number}</w:t>`);
    }
    if (!person) return cell;
    if (index === FIO_COLUMN) return fillCell(cell, person.fullName);
    if (index === POSITION_COLUMN) return fillCell(cell, person.position);
    if (index === ORGANIZATION_COLUMN) return fillCell(cell, person.organization);
    return cell;
  });
}

function fillTable(xml: string, model: GroupListModel): string {
  const rows = xml.match(ROW_RE) ?? [];
  const sampleIndex = rows.findIndex((row) => textOf(row).trim() === SAMPLE_LABEL);
  if (sampleIndex < 0) throw templateError(`нет строки «${SAMPLE_LABEL}»`);
  const studentRows = rows.slice(sampleIndex + 1);
  if (studentRows.length === 0) throw templateError("нет строк для слушателей");
  for (const row of [rows[sampleIndex], ...studentRows]) {
    if ((row.match(CELL_RE) ?? []).length !== COLUMN_COUNT) {
      throw templateError(`в строках таблицы ожидалось ${COLUMN_COUNT} колонок`);
    }
  }

  // Слушателей больше, чем строк в бланке, — добавляются копии последней строки
  const template = studentRows[studentRows.length - 1];
  const total = Math.max(studentRows.length, model.students.length);
  const filledRows = Array.from({ length: total }, (_, i) =>
    i < studentRows.length
      ? fillRow(studentRows[i], model.students[i] ?? null)
      : fillRow(template.replace(/ w14:paraId="[^"]*"/g, ""), model.students[i] ?? null, i + 1),
  );
  const sampleRow = fillRow(rows[sampleIndex], model.instructor);

  // Строки идут подряд: образец и строки слушателей заменяются одним куском
  const start = xml.indexOf(rows[sampleIndex]);
  const lastRow = studentRows[studentRows.length - 1];
  const end = xml.indexOf(lastRow, start) + lastRow.length;
  return xml.slice(0, start) + sampleRow + filledRows.join("") + xml.slice(end);
}

export async function renderGroupListDocx(model: GroupListModel): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");
  let xml = docFile.asText();

  xml = rewriteParagraph(xml, TITLE_LABEL, (text) =>
    replaceBlank(text, GROUP_BLANK_RE, `№ ${model.groupCode}`, TITLE_LABEL),
  );
  xml = rewriteParagraph(xml, PERIOD_LABEL, (text) =>
    replaceBlank(text, PERIOD_BLANK_RE, formatPeriod(model.startDate, model.endDate), PERIOD_LABEL),
  );

  xml = fillTable(xml, model);

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
