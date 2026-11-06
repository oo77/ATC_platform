/**
 * «Список группы» — бланк таблицы слушателей группы (Ф.И.О., год рождения, образование,
 * должность, аэропорт, телефон, образец подписи) по образцу «Таблица, список группы.docx».
 *
 * Собирается из шаблона server/assets/templates/group-list-template.docx правкой XML
 * «на месте» (pizzip), как «Лист ознакомления» (см. acquaintanceSheetService.ts).
 * Подставляются из базы только:
 *  - «Список группы №» — код группы;
 *  - «Дата обучения курса с … по …» — даты начала и окончания обучения группы.
 * «Курс» и таблица на 20 слушателей остаются пустыми — заполняются от руки.
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
  "group-list-template.docx",
);

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface GroupListModel {
  groupCode: string;
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

/** Собирает данные бланка. null — группа не найдена. */
export async function loadGroupListModel(groupId: string): Promise<GroupListModel | null> {
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

  return {
    groupCode: group.code,
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

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
