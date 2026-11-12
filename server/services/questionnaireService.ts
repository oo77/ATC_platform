/**
 * «Обезличенный вопросник» (SHAXSI KOʻRSATILMAGAN SOʻROVNOMA) — анкета, в которой слушатели
 * в конце обучения оценивают качество преподавания. Word по образцу
 * server/assets/templates/questionnaire-template.docx.
 *
 * Шаблон правится «на месте» (pizzip), как «Лист ознакомления» (см. acquaintanceSheetService.ts):
 * оформление, вопросы и таблица оценок остаются из шаблона. Заполняется только шапка —
 * таблица с реквизитами обучения; значение дописывается после постоянной подписи:
 *  - «Kurs nomi / Наименование курса» — название программы (на узбекском и русском);
 *  - «Guruh raqami / Номер группы» — код группы (на обеих строках);
 *  - «Guruhdagi tinglovchilar soni / Количество слушателей» — число слушателей в группе
 *    (на обеих строках);
 *  - «O'qitish davri / Период обучения» — первый и последний день обучения группы;
 *  - «O'qituvchi-instruktorning F.I.Sh. / Ф.И.О. Инструктора» — инструктор, выбранный при
 *    скачивании: латиницей и на русском (full_name_ru; не заполнено — латиницей);
 *    без инструктора остаётся пустым;
 *  - «O'qitilgan fan / modul / Преподаваемая дисциплина» — всегда «Aviatsiya xavfsizligi /
 *    Авиационная безопасность»;
 *  - «O'qitish joyi / Место проведения» и «To'ldirilgan sana / Дата заполнения» —
 *    вводит пользователь перед скачиванием (место — на двух языках).
 *
 * Чтобы вопросник умещался на 2 страницы: нижний колонтитул убран, в таблице открытых
 * вопросов (последняя таблица) удалены 2 последние строки.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { formatFullName } from "./evaluationSheetsService";
import { loadEmptyJournalInstructors } from "./emptyJournalService";
import { UnknownInstructorError } from "./acquaintanceSheetService";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "questionnaire-template.docx",
);

const DISCIPLINE_UZ = "Aviatsiya xavfsizligi";
const DISCIPLINE_RU = "Авиационная безопасность";

// ============================================================================
// ДАННЫЕ
// ============================================================================

/** Данные группы, которые подставляются автоматически */
export interface QuestionnaireGroup {
  groupCode: string;
  courseNameUz: string;
  courseNameRu: string;
  studentsCount: number;
  /** Первый день обучения, ГГГГ-ММ-ДД */
  startDate: string;
  /** Последний день обучения, ГГГГ-ММ-ДД */
  endDate: string;
}

/** Данные, которые пользователь вводит перед скачиванием */
export interface QuestionnaireInput {
  placeUz: string;
  placeRu: string;
  /** Дата заполнения, ГГГГ-ММ-ДД */
  filledDate: string;
  /** null — поле остаётся пустым */
  instructor: QuestionnaireInstructor | null;
}

export interface QuestionnaireInstructor {
  /** «Rasulov Kamol Abduxalikovich» */
  uz: string;
  /** «Расулов Камол Абдухаликович»; нет русского ФИО — как uz */
  ru: string;
}

interface GroupRow extends RowDataPacket {
  code: string;
  course_name: string | null;
  course_name_uz: string | null;
  start_date: string;
  end_date: string;
  students_count: number;
}

const collapseSpaces = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

/** Собирает данные группы. null — группа не найдена. */
export async function loadQuestionnaireGroup(
  groupId: string,
): Promise<QuestionnaireGroup | null> {
  const rows = await executeQuery<GroupRow[]>(
    `SELECT g.code,
            c.name AS course_name,
            c.name_uz AS course_name_uz,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') AS end_date,
            (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = g.id) AS students_count
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = rows[0];
  if (!group) return null;

  const courseNameRu = collapseSpaces(group.course_name);
  const courseNameUz = collapseSpaces(group.course_name_uz);
  return {
    groupCode: group.code,
    // Если название на одном из языков не заполнено — подставляется другое
    courseNameUz: courseNameUz || courseNameRu,
    courseNameRu: courseNameRu || courseNameUz,
    studentsCount: Number(group.students_count),
    startDate: group.start_date,
    endDate: group.end_date,
  };
}

/**
 * ФИО инструктора по его id (латиницей и на русском); null — инструктор не указан.
 * Инструктор не из расписания группы — UnknownInstructorError.
 */
export async function loadQuestionnaireInstructor(
  groupId: string,
  instructorId: string | null,
): Promise<QuestionnaireInstructor | null> {
  if (!instructorId) return null;
  const found = (await loadEmptyJournalInstructors(groupId)).find(
    (candidate) => candidate.id === instructorId,
  );
  if (!found) throw new UnknownInstructorError("Инструктор не ведёт занятия этой группы");
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT full_name_ru FROM instructors WHERE id = ? LIMIT 1`,
    [instructorId],
  );
  const uz = formatFullName(found.fullName);
  const ru = collapseSpaces(rows[0]?.full_name_ru);
  return { uz, ru: ru ? formatFullName(ru) : uz };
}

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];
const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «2026-10-27» → ««27» oktabr 2026 y.» / ««27» октября 2026 г.» */
function formatDate(ymd: string, months: string[], yearSuffix: string): string {
  const [year, month, day] = ymd.split("-");
  return `«${day}» ${months[Number(month) - 1]} ${year} ${yearSuffix}`;
}

const dateUz = (ymd: string) => formatDate(ymd, UZ_MONTHS, "y.");
const dateRu = (ymd: string) => formatDate(ymd, RU_MONTHS, "г.");

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const TABLE_RE = /<w:tbl>[\s\S]*?<\/w:tbl>/;
const PARA_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
const TEXT_RE = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;

/** Значение на русской строке: подпись в шаблоне мелкая (6,5 pt) и серая, значение — крупнее */
const RU_VALUE_PROPS = '<w:rPr><w:sz w:val="16"/></w:rPr>';
const UZ_VALUE_PROPS = "";

function templateError(problem: string): Error {
  return new Error(
    `Шаблон вопросника (questionnaire-template.docx) не соответствует ожидаемой структуре: ${problem}`,
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

const valueRun = (text: string, props: string) =>
  `<w:r>${props}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

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

/** Значение после подписи, в конце абзаца: «Kurs nomi:» → «Kurs nomi: Aviatsiya xavfsizligi» */
const appendValue = (p: string, value: string, props: string) =>
  p.replace(/<\/w:p>$/, () => `${valueRun(` ${value}`, props)}</w:p>`);

/**
 * Заготовка даты/периода в строке («: «___» __________ 20__ y.» и т.д.) — значением.
 * Подпись до заготовки остаётся в своём ране и формате; заготовка и всё после неё
 * (текст «dan … gacha» входит в заготовку) заменяются.
 */
function replaceBlank(p: string, blankStart: string, value: string, props: string): string {
  let replaced = false;
  const result = p.replace(RUN_RE, (run) => {
    const text = textOf(run);
    const at = text.indexOf(blankStart);
    if (replaced || at < 0) return run;
    replaced = true;
    const before = text.slice(0, at);
    const kept = before
      ? run.replace(TEXT_RE, () => `<w:t xml:space="preserve">${escapeXml(before)}</w:t>`)
      : "";
    return kept + valueRun(value, props);
  });
  if (!replaced) throw templateError(`в строке «${textOf(p).slice(0, 30)}» нет даты для заполнения`);
  return result;
}

/** Строк для ответов, которые убираются из таблицы открытых вопросов */
const OPEN_QUESTIONS_ROWS_REMOVED = 2;

/**
 * Вопросник — на 2 страницы: без нижнего колонтитула и без 2 последних строк
 * таблицы открытых вопросов (последняя таблица документа).
 */
function fitToTwoPages(xml: string): string {
  const FOOTER_REF_RE = /<w:footerReference [^>]*\/>/g;
  if (!FOOTER_REF_RE.test(xml)) throw templateError("нет нижнего колонтитула");
  const result = xml.replace(FOOTER_REF_RE, "");

  const tableStart = result.lastIndexOf("<w:tbl>");
  const tableEnd = result.indexOf("</w:tbl>", tableStart);
  if (tableStart < 0 || tableEnd < 0) throw templateError("нет таблицы открытых вопросов");
  const table = result.slice(tableStart, tableEnd);
  const rows = table.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? [];
  // Шапка таблицы + строки для ответов (пустые)
  const answerRows = rows.filter((row) => !textOf(row).trim());
  if (answerRows.length <= OPEN_QUESTIONS_ROWS_REMOVED) {
    throw templateError("в таблице открытых вопросов слишком мало строк");
  }
  const lastRows = rows.slice(-OPEN_QUESTIONS_ROWS_REMOVED);
  if (lastRows.some((row) => textOf(row).trim())) {
    throw templateError("последние строки таблицы открытых вопросов не пустые");
  }
  // Последние строки идут подряд в конце таблицы
  const removed = lastRows.join("");
  const cutFrom = table.lastIndexOf(removed);
  const trimmed = table.slice(0, cutFrom) + table.slice(cutFrom + removed.length);
  return result.slice(0, tableStart) + trimmed + result.slice(tableEnd);
}

export async function renderQuestionnaireDocx(
  group: QuestionnaireGroup,
  input: QuestionnaireInput,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");
  const xml = docFile.asText();

  // Заполняется только первая таблица — шапка; таблица оценок остаётся как есть
  const table = xml.match(TABLE_RE)?.[0];
  if (!table) throw templateError("нет таблицы с реквизитами обучения");

  let filled = table;
  const uz = (label: string, fn: (p: string) => string) => {
    filled = mapParagraph(filled, label, fn);
  };

  uz("Kurs nomi:", (p) => appendValue(p, group.courseNameUz, UZ_VALUE_PROPS));
  uz("Наименование курса:", (p) => appendValue(p, group.courseNameRu, RU_VALUE_PROPS));

  uz("O'qitish joyi:", (p) => appendValue(p, input.placeUz, UZ_VALUE_PROPS));
  uz("Место проведения:", (p) => appendValue(p, input.placeRu, RU_VALUE_PROPS));

  uz("Guruh raqami:", (p) => appendValue(p, group.groupCode, UZ_VALUE_PROPS));
  uz("Номер группы:", (p) => appendValue(p, group.groupCode, RU_VALUE_PROPS));
  uz("Guruhdagi tinglovchilar soni:", (p) =>
    appendValue(p, String(group.studentsCount), UZ_VALUE_PROPS),
  );
  uz("Количество слушателей в группе:", (p) =>
    appendValue(p, String(group.studentsCount), RU_VALUE_PROPS),
  );

  uz("O'qitish davri:", (p) =>
    replaceBlank(
      p,
      "«___»",
      `${dateUz(group.startDate)} dan ${dateUz(group.endDate)} gacha`,
      UZ_VALUE_PROPS,
    ),
  );
  uz("Период обучения:", (p) =>
    replaceBlank(
      p,
      "с «___»",
      `с ${dateRu(group.startDate)} по ${dateRu(group.endDate)}`,
      RU_VALUE_PROPS,
    ),
  );

  uz("To'ldirilgan sana:", (p) =>
    replaceBlank(p, "«___»", dateUz(input.filledDate), UZ_VALUE_PROPS),
  );
  uz("Дата заполнения:", (p) =>
    replaceBlank(p, "«___»", dateRu(input.filledDate), RU_VALUE_PROPS),
  );

  if (input.instructor) {
    const { uz: nameUz, ru: nameRu } = input.instructor;
    uz("O'qituvchi-instruktorning F.I.Sh.:", (p) => appendValue(p, nameUz, UZ_VALUE_PROPS));
    uz("Ф.И.О. Инструктора-преподавателя:", (p) => appendValue(p, nameRu, RU_VALUE_PROPS));
  }

  uz("O'qitilgan fan / modul:", (p) => appendValue(p, DISCIPLINE_UZ, UZ_VALUE_PROPS));
  uz("Преподаваемая дисциплина / модуль:", (p) =>
    appendValue(p, DISCIPLINE_RU, RU_VALUE_PROPS),
  );

  zip.file("word/document.xml", fitToTwoPages(xml.replace(table, () => filled)));
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
