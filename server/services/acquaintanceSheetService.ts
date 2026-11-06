/**
 * «Лист ознакомления» учебной группы (TANISHIB CHIQISH VARAQASI) — подписи слушателей
 * о вводном инструктаже и инструктаже по охране труда, по образцу
 * «Лист ознакомления uz ru.docx».
 *
 * Собирается из шаблона server/assets/templates/acquaintance-sheet-template.docx правкой XML
 * «на месте» (pizzip), как «Реестр» (см. registryService.ts). Оформление, постоянный текст
 * и таблица на 20 слушателей — из шаблона, ФИО и подписи слушатели вписывают от руки.
 * Подставляются из базы:
 *  - «Guruh / Группа» — код группы;
 *  - «O‘quv dasturi (kurs) nomi / Наименование учебной программы» — название курса
 *    на узбекском и русском через « / » (если заполнено одно — только оно);
 *  - «Yo‘riqnoma o‘tkazilgan sana / Дата проведения инструктажа» — первый день обучения
 *    группы: 27.10.2026 yil / г. (с названием месяца дата не помещается в строку);
 *  - «Yo‘riqnomani o‘tkazdi / Инструктаж провёл(а)» — ФИО инструктора, выбранного
 *    при скачивании; без инструктора остаётся линия для заполнения от руки.
 * Строка «F.I.Sh., lavozimi / Ф.И.О., должность» и подпись с датой внизу остаются пустыми,
 * в них меняется только год — на год начала обучения.
 *
 * Места для значений ищутся по постоянным подписям шаблона; линии «____» в них заменяются
 * значением.
 *
 * Бланк в шаблоне занимает страницу целиком. Если подставленные значения займут больше
 * строк, чем линии бланка (длинное название курса), строки таблицы слушателей становятся
 * ниже на столько, чтобы лист остался на одной странице.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { MONTSERRAT_LINE, textWidth } from "../utils/montserratMetrics";
import { formatFullName } from "./evaluationSheetsService";
import { loadEmptyJournalInstructors } from "./emptyJournalService";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "acquaintance-sheet-template.docx",
);

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface AcquaintanceSheetModel {
  groupCode: string;
  /** «Aviatsiya xavfsizligi / Авиационная безопасность»; пусто — линия остаётся */
  courseName: string;
  /** Первый день обучения, ГГГГ-ММ-ДД */
  startDate: string;
  /** «Rasulov Kamol Abduxalikovich»; null — линия для заполнения от руки */
  instructor: string | null;
}

interface GroupRow extends RowDataPacket {
  code: string;
  course_name: string | null;
  course_name_uz: string | null;
  start_date: string;
}

const collapseSpaces = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

/** Название курса на узбекском и русском; одинаковые или незаполненные — один раз */
function bilingualCourseName(uz: string | null, ru: string | null): string {
  const names = [collapseSpaces(uz), collapseSpaces(ru)].filter(Boolean);
  return [...new Set(names)].join(" / ");
}

/** instructorId не из расписания группы */
export class UnknownInstructorError extends Error {}

/**
 * Собирает данные листа. null — группа не найдена.
 * instructorId — инструктор из расписания группы (см. loadEmptyJournalInstructors) или null;
 * посторонний id — UnknownInstructorError.
 */
export async function loadAcquaintanceSheetModel(
  groupId: string,
  instructorId: string | null,
): Promise<AcquaintanceSheetModel | null> {
  const rows = await executeQuery<GroupRow[]>(
    `SELECT g.code,
            c.name AS course_name,
            c.name_uz AS course_name_uz,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') AS start_date
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = rows[0];
  if (!group) return null;

  let instructor: string | null = null;
  if (instructorId) {
    const found = (await loadEmptyJournalInstructors(groupId)).find(
      (candidate) => candidate.id === instructorId,
    );
    if (!found) throw new UnknownInstructorError("Инструктор не ведёт занятия этой группы");
    instructor = formatFullName(found.fullName);
  }

  return {
    groupCode: group.code,
    courseName: bilingualCourseName(group.course_name_uz, group.course_name),
    startDate: group.start_date,
    instructor,
  };
}

/** «2026-10-27» → «27.10.2026» */
const formatDate = (ymd: string) => ymd.split("-").reverse().join(".");

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const TABLE_RE = /<w:tbl>[\s\S]*?<\/w:tbl>/;
const ROW_RE = /<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g;
const PARA_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
const TEXT_RE = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;

const GROUP_LABEL = "Guruh / Группа:";
const COURSE_LABEL = "O‘quv dasturi (kurs) nomi";
const DATE_LABEL = "Yo‘riqnoma o‘tkazilgan sana";
const INSTRUCTOR_LABEL = "Yo‘riqnomani o‘tkazdi";
const SIGNATURE_LABEL = "Imzo / Подпись:";

/** Линия для заполнения: «_____» */
const BLANK_RE = /^_+$/;
/** Кегль текста бланка, pt (w:sz 24) */
const TEXT_SIZE_PT = 12;
/** Пустая линия укорачивается с запасом, чтобы Word наверняка не перенёс её на вторую строку */
const BLANK_FIT = 0.97;
/** Запас к высоте, которую нужно освободить в таблице, — на расхождение расчёта с Word, twip */
const FIT_RESERVE_TWIPS = 40;

function templateError(problem: string): Error {
  return new Error(
    `Шаблон листа ознакомления (acquaintance-sheet-template.docx) не соответствует ожидаемой структуре: ${problem}`,
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

const setRunText = (run: string, text: string) =>
  run.replace(TEXT_RE, () => `<w:t xml:space="preserve">${escapeXml(text)}</w:t>`);

/** Ширина текста на странице (pt): ширина листа без полей из w:sectPr */
function pageTextWidth(xml: string): number {
  const page = xml.match(/<w:pgSz w:w="(\d+)"/);
  const left = xml.match(/<w:pgMar [^>]*w:left="(\d+)"/);
  const right = xml.match(/<w:pgMar [^>]*w:right="(\d+)"/);
  if (!page || !left || !right) throw templateError("не найдены размеры страницы");
  return (Number(page[1]) - Number(left[1]) - Number(right[1])) / 20;
}

/**
 * Число строк, на которые Word разобьёт абзац шириной widthPt: по ранам с их жирностью
 * и кеглем, перенос по пробелам (слово шире строки рвётся посимвольно).
 */
function paragraphLines(p: string, widthPt: number): number {
  let lines = 1;
  let lineWidth = 0;
  let word = 0;
  let gap = 0;
  const flush = () => {
    if (word > 0) {
      if (lineWidth > 0 && lineWidth + gap + word > widthPt) {
        lines += 1;
        lineWidth = 0;
      }
      if (word > widthPt) {
        lines += Math.floor(word / widthPt);
        lineWidth = word % widthPt;
      } else {
        lineWidth += (lineWidth > 0 ? gap : 0) + word;
      }
    }
    word = 0;
    gap = 0;
  };
  for (const run of p.match(RUN_RE) ?? []) {
    const bold = /<w:b\/>/.test(run);
    const halfPt = run.match(/<w:sz w:val="(\d+)"/)?.[1];
    const size = halfPt ? Number(halfPt) / 2 : TEXT_SIZE_PT;
    for (const token of textOf(run).split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        flush();
        gap += textWidth(token, size, bold);
      } else {
        word += textWidth(token, size, bold);
      }
    }
  }
  flush();
  return lines;
}

/** Заменяет абзац, текст которого начинается с label, результатом fn */
function mapParagraph(xml: string, label: string, fn: (p: string) => string): string {
  let found = 0;
  const result = xml.replace(PARA_RE, (p) => {
    if (!textOf(p).trim().startsWith(label)) return p;
    found += 1;
    return fn(p);
  });
  if (found !== 1) throw templateError(`ожидалась одна строка «${label}»`);
  return result;
}

/**
 * Линия «____» после подписи (в шаблоне бывает разбита на несколько ранов) — значением:
 * первый ран линии получает текст в своём формате, остальные убираются.
 */
function fillBlank(p: string, value: string, where: string): string {
  let replaced = false;
  const result = p.replace(RUN_RE, (run) => {
    if (!BLANK_RE.test(textOf(run))) return run;
    if (replaced) return "";
    replaced = true;
    return setRunText(run, value);
  });
  if (!replaced) throw templateError(`в строке «${where}» нет линии для заполнения`);
  return result;
}

/** Линия «____», не уместившаяся в строку с подписью, укорачивается до конца этой строки */
function fitBlankToLine(p: string, widthPt: number): string {
  const blank = textOf(p.match(RUN_RE)?.find((run) => BLANK_RE.test(textOf(run))) ?? "");
  let result = p;
  for (let length = blank.length; length > 1; length -= 1) {
    result = fillBlank(p, "_".repeat(length), INSTRUCTOR_LABEL);
    if (paragraphLines(result, widthPt * BLANK_FIT) === 1) break;
  }
  return result;
}

/**
 * Дата ««___» ______ 2026 yil / г.» (в шаблоне разбита на раны): от «___» до года
 * включительно — значение, «yil / г.» после него остаётся.
 */
function fillDate(p: string, value: string, where: string): string {
  let state: "before" | "inside" | "done" = "before";
  const result = p.replace(RUN_RE, (run) => {
    if (state === "done") return run;
    const text = textOf(run);
    const first = state === "before" && text.startsWith("«___»");
    if (first) state = "inside";
    if (state !== "inside") return run;
    const year = text.match(/\d{4}/);
    if (year) {
      state = "done";
      return setRunText(run, (first ? value : "") + text.slice(year.index! + year[0].length));
    }
    // раны между «___» и годом — продолжение линии
    return first ? setRunText(run, value) : "";
  });
  if (state !== "done") {
    throw templateError(`в строке «${where}» не найдена дата ««___» ______ 2026»`);
  }
  return result;
}

/** Год в дате «Sana / Дата: «___» ______ 2026 yil» — на year, линии остаются */
function fillYear(p: string, year: string, where: string): string {
  let done = false;
  const result = p.replace(RUN_RE, (run) => {
    const text = textOf(run);
    if (done || !/\d{4}/.test(text)) return run;
    done = true;
    return setRunText(run, text.replace(/\d{4}/, year));
  });
  if (!done) throw templateError(`в строке «${where}» не найден год`);
  return result;
}

/**
 * Освобождает высоту extraLines строк текста, уменьшая верхнее и нижнее поля ячеек
 * в строках слушателей (в шаблоне — по 40 twip) поровну, но не меньше нуля.
 */
function compactStudentRows(xml: string, extraLines: number): string {
  const table = xml.match(TABLE_RE);
  if (!table) throw templateError("нет таблицы слушателей");
  const rows = table[0].match(ROW_RE) ?? [];
  const studentRows = rows.slice(1);
  if (studentRows.length === 0) throw templateError("в таблице нет строк слушателей");

  const needTwips = extraLines * TEXT_SIZE_PT * MONTSERRAT_LINE * 20 + FIT_RESERVE_TWIPS;
  // у каждой строки два поля — сверху и снизу
  const cut = Math.ceil(needTwips / (2 * studentRows.length));

  let compacted = table[0];
  for (const row of studentRows) {
    const shrunk = row.replace(
      /<w:(top|bottom) w:w="(\d+)" w:type="dxa"\/>/g,
      (_m, side: string, w: string) =>
        `<w:${side} w:w="${Math.max(0, Number(w) - cut)}" w:type="dxa"/>`,
    );
    compacted = compacted.replace(row, () => shrunk);
  }
  return xml.replace(table[0], () => compacted);
}

export async function renderAcquaintanceSheetDocx(
  model: AcquaintanceSheetModel,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");
  let xml = docFile.asText();

  const widthPt = pageTextWidth(xml);
  const year = model.startDate.slice(0, 4);
  const { groupCode, courseName, instructor } = model;

  // На сколько строк заполненный бланк длиннее шаблона
  let extraLines = 0;
  const fill = (label: string, fn: (p: string) => string) => {
    xml = mapParagraph(xml, label, (p) => {
      const filled = fn(p);
      extraLines += paragraphLines(filled, widthPt) - paragraphLines(p, widthPt);
      return filled;
    });
  };

  fill(GROUP_LABEL, (p) => fillBlank(p, groupCode, GROUP_LABEL));
  if (courseName) fill(COURSE_LABEL, (p) => fillBlank(p, courseName, COURSE_LABEL));
  fill(DATE_LABEL, (p) => fillDate(p, formatDate(model.startDate), DATE_LABEL));
  fill(INSTRUCTOR_LABEL, (p) =>
    instructor ? fillBlank(p, instructor, INSTRUCTOR_LABEL) : fitBlankToLine(p, widthPt),
  );
  // подпись и дата внизу заполняются от руки — меняется только год
  fill(SIGNATURE_LABEL, (p) => fillYear(p, year, SIGNATURE_LABEL));

  if (extraLines > 0) xml = compactStudentRows(xml, extraLines);

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
