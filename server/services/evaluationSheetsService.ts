/**
 * «Оценочные листы» (BAHOLASH VARAQASI) учебной группы — по одному листу на слушателя,
 * все листы в одном Word-файле, по образцу «AB-APA-02PP Оценочные листы (устный).docx».
 *
 * Собирается из утверждённого шаблона server/assets/templates/evaluation-sheets-template.docx
 * правкой XML «на месте» (pizzip), как и «Пустой журнал» (см. emptyJournalService.ts): в шаблоне
 * ровно один лист, он размножается по числу слушателей — каждый следующий с новой страницы.
 * Бланк организации с логотипом на заднем фоне (колонтитул, один на все страницы), шрифты
 * (Montserrat встроен в файл) и таблицы остаются точно такими, как в шаблоне. Подставляются три поля, помеченные в шаблоне жёлтым маркером
 * (в готовом файле маркер убирается):
 *  - ФИО слушателя полностью;
 *  - должность слушателя на узбекском (students.position_uz, а если она не заполнена — position);
 *  - название программы группы в колонке «Fan (modul) nomi (Kurs nomi)» — после постоянной
 *    строки «Yakuniy imtihon.» (courses.name_uz, а если оно не заполнено — name);
 * и состав комиссии, который пользователь вводит при скачивании (см. «СОСТАВ КОМИССИИ» ниже).
 *
 * Лист образца занимает страницу почти целиком, поэтому при длинном названии курса или
 * должности либо при большом составе комиссии лист ужимается ровно настолько, чтобы остаться
 * одной страницей (см. «ЛИСТ НА ОДНОЙ СТРАНИЦЕ» ниже); при составе как в образце
 * (заместитель и два члена комиссии) обычный лист выходит точь-в-точь как образец.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { textWidth } from "../utils/montserratMetrics";
import {
  abbreviateFullName,
  PATRONYMIC_PARTICLE_RE,
  type EvaluationSheetsCommission,
} from "../../shared/utils/evaluationSheets";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "evaluation-sheets-template.docx",
);

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface EvaluationSheetStudent {
  /** Как в бланке: «Hamrayeva Sarvinoz Mansur qizi» */
  fullName: string;
  /** Должность на узбекском; пусто — строка остаётся для заполнения от руки */
  position: string;
}

export interface EvaluationSheetsModel {
  groupCode: string;
  /** Название программы группы (на узбекском, если оно задано в карточке программы) */
  courseName: string;
  /** Слушатели в алфавитном порядке — по листу на каждого */
  students: EvaluationSheetStudent[];
}

interface GroupRow extends RowDataPacket {
  code: string;
  course_name: string | null;
  course_name_uz: string | null;
}

interface StudentRow extends RowDataPacket {
  full_name: string | null;
  position: string | null;
  position_uz: string | null;
}

const collapseSpaces = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim();

/**
 * «HAMRAYEVA SARVINOZ MANSUR QIZI» → «Hamrayeva Sarvinoz Mansur qizi»: ФИО полностью,
 * каждое слово (и часть после дефиса) с заглавной буквы, кроме «o‘g‘li»/«qizi».
 */
export function formatFullName(fullName: string): string {
  return collapseSpaces(fullName)
    .toLowerCase()
    .replace(/[^\s-]+/g, (word) =>
      PATRONYMIC_PARTICLE_RE.test(word)
        ? word
        : word.replace(/\p{L}/u, (ch) => ch.toUpperCase()),
    );
}

/** Собирает данные листов. null — группа не найдена. */
export async function loadEvaluationSheetsModel(
  groupId: string,
): Promise<EvaluationSheetsModel | null> {
  const groupRows = await executeQuery<GroupRow[]>(
    `SELECT g.code, c.name AS course_name, c.name_uz AS course_name_uz
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = groupRows[0];
  if (!group) return null;

  const studentRows = await executeQuery<StudentRow[]>(
    `SELECT s.full_name, s.position, s.position_uz
     FROM study_group_students sgs
     JOIN students s ON s.id = sgs.student_id
     WHERE sgs.group_id = ?
     ORDER BY s.full_name`,
    [groupId],
  );

  return {
    groupCode: group.code,
    courseName: collapseSpaces(group.course_name_uz) || collapseSpaces(group.course_name),
    students: studentRows
      .map((s) => ({
        fullName: formatFullName(s.full_name ?? ""),
        position: collapseSpaces(s.position_uz) || collapseSpaces(s.position),
      }))
      .filter((s) => s.fullName),
  };
}

// ============================================================================
// ЛИСТ НА ОДНОЙ СТРАНИЦЕ
// ============================================================================
//
// В образце до конца страницы остаётся всего ~30 pt (колонтитул с бланком и логотипом на
// заднем фоне — один на все страницы). Вторая-третья строка должности или название курса
// длиннее, чем в образце (9 строк), съедают этот запас — и конец листа («“___” ___ 20__-yil»)
// уезжает на отдельную страницу. Поэтому число строк считается заранее (тем же шрифтом и в тех
// же ширинах, что в шаблоне), и если лист не помещается — уменьшается кегль названия курса.
//
// Геометрия ниже снята с шаблона и сверена с вёрсткой Word; при правке шаблона (ширины
// колонок, кегли, пустые строки между блоками) её нужно перепроверить.

/** Ширина текста (pt) в колонке «Fan (modul) nomi» и в строках ФИО/должности — без полей ячейки */
const COURSE_TEXT_WIDTH_PT = (4003 - 2 * 108) / 20;
const PERSON_TEXT_WIDTH_PT = (9496 - 2 * 108) / 20;
/** Кегли шаблона в полупунктах (как w:sz): название курса — 10 pt, ФИО и должность — 12 pt */
const COURSE_HALF_PT = 20;
const PERSON_HALF_PT = 24;
/** Меньше 6 pt название курса не делается — дальше лист просто перейдёт на вторую страницу */
const MIN_COURSE_HALF_PT = 12;
/** Высота строки в шаблоне — 1,3 кегля (метрики Montserrat × межстрочный интервал стиля) */
const LINE_HEIGHT = 1.3;
/** Название курса в образце занимает 9 строк */
const TEMPLATE_COURSE_LINES = 9;
/** Свободная высота до конца страницы (pt): в Word — 30, здесь с небольшим запасом */
const PAGE_SLACK_PT = 28;

/** Число строк, на которые Word разобьёт текст в колонке данной ширины */
export function countWrappedLines(text: string, sizePt: number, widthPt: number): number {
  const space = textWidth(" ", sizePt);
  let lines = 1;
  let lineWidth = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    // Word переносит строку по пробелам и после дефиса
    word.split(/(?<=-)/).forEach((part, i) => {
      const width = textWidth(part, sizePt);
      const gap = i === 0 ? space : 0;
      if (lineWidth > 0 && lineWidth + gap + width > widthPt) {
        lines += 1;
        lineWidth = 0;
      }
      if (width > widthPt) {
        // слово шире колонки рвётся посимвольно
        lines += Math.floor(width / widthPt);
        lineWidth = width % widthPt;
      } else {
        lineWidth += (lineWidth > 0 ? gap : 0) + width;
      }
    });
  }
  return lines;
}

/**
 * Наибольший кегль названия курса (в полупунктах, шаг 0,5 pt), при котором лист остаётся
 * одной страницей. extraPersonLines — сколько строк сверх одной заняли ФИО и должность,
 * commissionExtraPt — на сколько блок комиссии выше, чем в образце (см. «СОСТАВ КОМИССИИ»).
 */
export function fitCourseHalfPt(
  courseName: string,
  extraPersonLines: number,
  commissionExtraPt = 0,
): number {
  const budgetPt =
    TEMPLATE_COURSE_LINES * (COURSE_HALF_PT / 2) * LINE_HEIGHT +
    PAGE_SLACK_PT -
    extraPersonLines * (PERSON_HALF_PT / 2) * LINE_HEIGHT -
    commissionExtraPt;

  for (let halfPt = COURSE_HALF_PT; halfPt > MIN_COURSE_HALF_PT; halfPt--) {
    const sizePt = halfPt / 2;
    const lines = countWrappedLines(courseName, sizePt, COURSE_TEXT_WIDTH_PT);
    if (lines * sizePt * LINE_HEIGHT <= budgetPt) return halfPt;
  }
  return MIN_COURSE_HALF_PT;
}

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;

function templateError(problem: string): Error {
  return new Error(
    `Шаблон оценочных листов (evaluation-sheets-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const rPrOf = (run: string) => /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] ?? "";
const withoutHighlight = (rPr: string) => rPr.replace(/<w:highlight [^>]*\/>/g, "");
const makeRun = (rPr: string, text: string) =>
  `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

const withFontSize = (rPr: string, halfPt: number) =>
  rPr.replace(/(<w:sz(?:Cs)? w:val=")\d+("\/>)/g, `$1${halfPt}$2`);

interface FieldValue {
  text: string;
  /** Кегль в полупунктах вместо шаблонного (не задан — как в шаблоне) */
  halfPt?: number;
}

/**
 * Подставляет значения в «жёлтые» поля по порядку: каждая группа подряд идущих ранов
 * с маркером заменяется одним раном (формат первого рана, без маркера).
 */
function fillMarkedFields(xml: string, values: FieldValue[]): string {
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
    const rPr = withoutHighlight(rPrOf(run));
    return makeRun(value.halfPt ? withFontSize(rPr, value.halfPt) : rPr, value.text);
  });

  if (group + 1 !== values.length) {
    throw templateError(
      `на листе найдено полей с маркером: ${group + 1}, ожидалось ${values.length} (ФИО, должность, название курса)`,
    );
  }
  // Маркер может стоять и на знаке абзаца (pPr/rPr) — убираем и его
  return result.replace(/<w:highlight [^>]*\/>/g, "");
}

/** Первый абзац листа (заголовок «BAHOLASH VARAQASI») — с новой страницы */
function startOnNewPage(sheetXml: string): string {
  const paragraphOpen = /^<w:p(?: [^>]*)?>/.exec(sheetXml)?.[0];
  if (!paragraphOpen) {
    throw templateError("лист должен начинаться с абзаца-заголовка, а не с таблицы");
  }
  const rest = sheetXml.slice(paragraphOpen.length);

  // По схеме OOXML pageBreakBefore идёт в pPr после pStyle/keepNext/keepLines
  const pPrStart =
    /^<w:pPr>(?:<w:pStyle [^>]*\/>)?(?:<w:keepNext\/>)?(?:<w:keepLines\/>)?/.exec(rest)?.[0];
  return pPrStart
    ? paragraphOpen + pPrStart + "<w:pageBreakBefore/>" + rest.slice(pPrStart.length)
    : paragraphOpen + "<w:pPr><w:pageBreakBefore/></w:pPr>" + rest;
}

// ============================================================================
// СОСТАВ КОМИССИИ
// ============================================================================
//
// Состав комиссии пользователь вводит при скачивании. В шаблоне он набран обычным текстом
// (без маркера), поэтому места ищутся по постоянным подписям шаблона:
//  - таблица оценок, колонка «Komissiya raisining F.I.Sh.» — ФИО председателя полностью;
//  - таблица подписей — пары строк «ФИО — (imzo)» с подписями «Komissiya raisi:»,
//    «Komissiya raisi o‘rinbosari:», «Komissiya a’zolari:» и ещё одна пара без подписи (второй
//    член комиссии). Председатель — сокращённо («S.U. Ismailov»), заместитель и члены комиссии —
//    как введено. Пары заместителя нет, если он не указан; первый член комиссии стоит в паре
//    с подписью, остальные — в парах без подписи под ним;
//  - строка «Komissiya raisi:» под решением о допуске — снова председатель сокращённо.
//
// Каждый член комиссии сверх двух удлиняет лист на пару строк. Чтобы лист остался одной
// страницей, сначала убираются пустые строки-отступы вокруг таблицы подписей (по одной,
// сколько нужно), и только потом уменьшается кегль названия курса.
//
// Геометрия снята с шаблона и сверена с вёрсткой Word, как и в разделе «ЛИСТ НА ОДНОЙ СТРАНИЦЕ».

const TABLE_RE = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
const ROW_RE = /<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g;
const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;
const PARAGRAPH_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
const EMPTY_PARAGRAPH = "<w:p(?: [^>]*)?>(?:<w:pPr>(?:(?!</w:pPr>)[\\s\\S])*</w:pPr>)?</w:p>";
const LEADING_EMPTY_PARAGRAPH_RE = new RegExp(`^${EMPTY_PARAGRAPH}`);
const TRAILING_EMPTY_PARAGRAPH_RE = new RegExp(`${EMPTY_PARAGRAPH}$`);

/**
 * Ширина текста (pt) в колонке «Komissiya raisining F.I.Sh.» и в колонке ФИО таблицы подписей —
 * без полей ячейки и с запасом в 1 pt на расхождение с вёрсткой Word
 */
const CHAIRMAN_TEXT_WIDTH_PT = (1938 - 2 * 108) / 20 - 1;
const SIGNER_TEXT_WIDTH_PT = (2835 - 2 * 108) / 20 - 1;
/** Кегли в полупунктах: ФИО председателя в таблице оценок — 10 pt, мельче 7 pt не делается */
const CHAIRMAN_HALF_PT = 20;
const MIN_CHAIRMAN_HALF_PT = 14;
/** ФИО в таблице подписей — 12 pt; чтобы остаться в одну строку, уменьшается не более чем до 10 pt */
const SIGNER_HALF_PT = 24;
const MIN_SIGNER_HALF_PT = 20;
/** В таблице подписей образца четыре пары «ФИО — (imzo)» — восемь строк, каждая ~16 pt */
const TEMPLATE_SIGNER_LINES = 8;
const SIGNER_LINE_PT = 16;
/**
 * Пустые строки-отступы вокруг таблицы подписей: в образце их две над таблицей и три под ней,
 * каждая ~15,4 pt. Убрать можно три — первую под таблицей, вторую над ней, вторую под ней
 * (в таком порядке); по одной пустой строке над таблицей и под ней остаётся всегда.
 */
const SIGNER_SPACER_PT = 15;
const MAX_REMOVED_SIGNER_SPACERS = 3;

/** Подпись без пробелов, апострофов и регистра: «Komissiya a’zolari:» → «komissiyaazolari:» */
const labelKey = (xml: string) =>
  Array.from(xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g), (m) => m[1])
    .join("")
    .replace(/[^a-z:]/gi, "")
    .toLowerCase();

const CHAIRMAN_COLUMN_LABEL = "komissiyaraisiningfish";
const CHAIRMAN_LABEL = "komissiyaraisi:";
/** Подписи строк таблицы подписей в шаблоне (первая колонка) */
const SIGNER_ROW_LABELS = [
  CHAIRMAN_LABEL,
  "",
  "komissiyaraisiorinbosari:",
  "",
  "komissiyaazolari:",
  "",
  "",
  "",
];

/** ФИО в таблице подписей сверху вниз: председатель, заместитель (если есть), члены комиссии */
const signerNames = (commission: EvaluationSheetsCommission) => [
  abbreviateFullName(commission.chairman),
  ...(commission.deputy ? [commission.deputy] : []),
  ...commission.members,
];

/**
 * Наибольший кегль (полупункты, от base до min), при котором каждая из частей текста
 * помещается в строку шириной widthPt; null — не помещается и при min.
 */
function fitHalfPt(
  parts: string[],
  baseHalfPt: number,
  minHalfPt: number,
  widthPt: number,
): number | null {
  for (let halfPt = baseHalfPt; halfPt >= minHalfPt; halfPt--) {
    if (parts.every((part) => textWidth(part, halfPt / 2) <= widthPt)) return halfPt;
  }
  return null;
}

/**
 * ФИО в таблице подписей: чуть длиннее колонки — кегль уменьшается, чтобы инициалы не
 * оторвались от фамилии; намного длиннее (ФИО полностью) — переносится шаблонным кеглем.
 */
function fitSignerName(name: string): { halfPt: number; lines: number } {
  const halfPt = fitHalfPt([name], SIGNER_HALF_PT, MIN_SIGNER_HALF_PT, SIGNER_TEXT_WIDTH_PT);
  return halfPt
    ? { halfPt, lines: 1 }
    : {
        halfPt: SIGNER_HALF_PT,
        lines: countWrappedLines(name, SIGNER_HALF_PT / 2, SIGNER_TEXT_WIDTH_PT),
      };
}

interface CommissionLayout {
  /** Сколько пустых строк-отступов вокруг таблицы подписей убрать (см. SIGNER_SPACER_PT) */
  removedSpacers: number;
  /** На сколько блок комиссии после этого выше, чем в образце, pt (меньше нуля — ниже) */
  extraPt: number;
}

function fitCommissionLayout(
  courseName: string,
  commission: EvaluationSheetsCommission,
): CommissionLayout {
  // Пара — строка ФИО (или несколько, если ФИО переносится) и строка «(imzo)»
  const lines = signerNames(commission).reduce(
    (sum, name) => sum + fitSignerName(name).lines + 1,
    0,
  );
  let extraPt = (lines - TEMPLATE_SIGNER_LINES) * SIGNER_LINE_PT;

  // Отступы убираются только под выросший состав и только пока название курса не помещается
  // на странице шаблонным кеглем
  let removedSpacers = 0;
  while (
    removedSpacers < MAX_REMOVED_SIGNER_SPACERS &&
    extraPt > 0 &&
    fitCourseHalfPt(courseName, 0, extraPt) < COURSE_HALF_PT
  ) {
    extraPt -= SIGNER_SPACER_PT;
    removedSpacers += 1;
  }
  return { removedSpacers, extraPt };
}

/**
 * Заменяет текст абзаца одним раном в формате прежнего текста. Если в абзаце есть
 * табуляции, заменяется только текст после последней из них.
 */
function setParagraphText(paragraph: string, text: string, halfPt?: number): string {
  const runs = Array.from(paragraph.matchAll(RUN_RE));
  let from = 0;
  runs.forEach((run, i) => {
    if (run[0].includes("<w:tab/>")) from = i + 1;
  });
  const first = runs[from];
  const last = runs[runs.length - 1];
  if (!first || !last) {
    throw templateError("в месте для ФИО из состава комиссии нет образца текста");
  }
  const rPr = rPrOf(first[0]);
  return (
    paragraph.slice(0, first.index) +
    makeRun(halfPt ? withFontSize(rPr, halfPt) : rPr, text) +
    paragraph.slice(last.index + last[0].length)
  );
}

/** Заменяет текст в ячейке строки таблицы (cellIndex — с нуля) */
function setCellText(row: string, cellIndex: number, text: string, halfPt?: number): string {
  let i = -1;
  return row.replace(CELL_RE, (cell) => {
    i += 1;
    return i === cellIndex
      ? cell.replace(PARAGRAPH_RE, (paragraph) => setParagraphText(paragraph, text, halfPt))
      : cell;
  });
}

/** Заменяет строки таблицы (все подряд, от первой до последней) новыми */
function replaceRows(table: string, rows: string[], newRows: string[]): string {
  const start = table.indexOf(rows[0]!);
  const lastRow = rows[rows.length - 1]!;
  const end = table.lastIndexOf(lastRow) + lastRow.length;
  return table.slice(0, start) + newRows.join("") + table.slice(end);
}

/** Таблица оценок: ФИО председателя полностью — в колонке «Komissiya raisining F.I.Sh.» */
function fillChairmanColumn(table: string, chairman: string): string {
  const rows = table.match(ROW_RE) ?? [];
  const column = (rows[0]?.match(CELL_RE) ?? []).findIndex(
    (cell) => labelKey(cell) === CHAIRMAN_COLUMN_LABEL,
  );
  if (rows.length !== 2 || column < 0) {
    throw templateError(
      "в таблице оценок ожидались строка заголовков с колонкой «Komissiya raisining F.I.Sh.» и одна строка под ней",
    );
  }

  // Колонка узкая: длинное слово (отчество) Word разорвал бы посреди — кегль уменьшается,
  // пока каждое слово не поместится в строку целиком
  const halfPt =
    fitHalfPt(
      chairman.split(" "),
      CHAIRMAN_HALF_PT,
      MIN_CHAIRMAN_HALF_PT,
      CHAIRMAN_TEXT_WIDTH_PT,
    ) ?? MIN_CHAIRMAN_HALF_PT;

  return replaceRows(table, rows, [rows[0]!, setCellText(rows[1]!, column, chairman, halfPt)]);
}

/** Таблица подписей: пары строк «ФИО — (imzo)» по составу комиссии */
function fillSignersTable(table: string, commission: EvaluationSheetsCommission): string {
  const rows = table.match(ROW_RE) ?? [];
  const labels = rows.map((row) => labelKey(row.match(CELL_RE)?.[0] ?? ""));
  if (labels.join("|") !== SIGNER_ROW_LABELS.join("|")) {
    throw templateError(
      "в таблице подписей ожидались четыре пары строк «ФИО — (imzo)»: «Komissiya raisi:», «Komissiya raisi o‘rinbosari:», «Komissiya a’zolari:» и второй член комиссии",
    );
  }

  const pair = (nameRow: number, name: string) =>
    setCellText(rows[nameRow]!, 1, name, fitSignerName(name).halfPt) + rows[nameRow + 1]!;
  return replaceRows(table, rows, [
    pair(0, abbreviateFullName(commission.chairman)),
    commission.deputy ? pair(2, commission.deputy) : "",
    ...commission.members.map((member, i) => pair(i === 0 ? 4 : 6, member)),
  ]);
}

/**
 * Убирает count пустых строк-отступов вокруг таблицы подписей (порядок — см. SIGNER_SPACER_PT).
 * before — текст листа между таблицей оценок и таблицей подписей, after — после таблицы подписей.
 */
function removeSignerSpacers(before: string, after: string, count: number): [string, string] {
  for (let i = 0; i < count; i++) {
    const length = before.length + after.length;
    if (i === 1) before = before.replace(TRAILING_EMPTY_PARAGRAPH_RE, "");
    else after = after.replace(LEADING_EMPTY_PARAGRAPH_RE, "");
    if (before.length + after.length === length) {
      throw templateError("вокруг таблицы подписей комиссии ожидались пустые строки-отступы");
    }
  }
  return [before, after];
}

/** Подставляет состав комиссии в лист шаблона (один раз — состав общий для всех слушателей) */
function applyCommission(
  sheetXml: string,
  commission: EvaluationSheetsCommission,
  removedSpacers: number,
): string {
  const tables = Array.from(sheetXml.matchAll(TABLE_RE));
  const gradesTable = tables.find((table) => labelKey(table[0]).includes(CHAIRMAN_COLUMN_LABEL));
  const signersTable = tables.find((table) => labelKey(table[0]).startsWith(CHAIRMAN_LABEL));
  if (!gradesTable || !signersTable || gradesTable.index > signersTable.index) {
    throw templateError(
      "не найдены таблица оценок (колонка «Komissiya raisining F.I.Sh.») и таблица подписей под ней (строка «Komissiya raisi:»)",
    );
  }

  const signersEnd = signersTable.index + signersTable[0].length;
  const [beforeSigners, afterSigners] = removeSignerSpacers(
    sheetXml.slice(gradesTable.index + gradesTable[0].length, signersTable.index),
    sheetXml.slice(signersEnd),
    removedSpacers,
  );

  // Строка «Komissiya raisi:<табуляции>R.D. Kashayev» под решением о допуске — тем же
  // кеглем, что председатель в таблице подписей
  const chairman = abbreviateFullName(commission.chairman);
  let closingLines = 0;
  const tail = afterSigners.replace(PARAGRAPH_RE, (paragraph) => {
    if (!paragraph.includes("<w:tab/>") || !labelKey(paragraph).startsWith(CHAIRMAN_LABEL)) {
      return paragraph;
    }
    closingLines += 1;
    return setParagraphText(paragraph, chairman, fitSignerName(chairman).halfPt);
  });
  if (closingLines !== 1) {
    throw templateError(
      "под таблицей подписей ожидалась одна строка «Komissiya raisi:» с ФИО после табуляций",
    );
  }

  return (
    sheetXml.slice(0, gradesTable.index) +
    fillChairmanColumn(gradesTable[0], commission.chairman) +
    beforeSigners +
    fillSignersTable(signersTable[0], commission) +
    tail
  );
}

export async function renderEvaluationSheetsDocx(
  model: EvaluationSheetsModel,
  commission: EvaluationSheetsCommission,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");

  // Служебные метки Word (проверка орфографии, идентификаторы абзацев) — не нужны,
  // а идентификаторы после размножения листа стали бы неуникальными
  const xml = docFile
    .asText()
    .replace(/<w:proofErr [^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "")
    .replace(/ w14:(?:paraId|textId)="[^"]*"/g, "")
    .replace(/ w:rsid[A-Za-z]*="[^"]*"/g, "");

  // Лист — всё тело документа до параметров раздела (sectPr: поля страницы и колонтитулы)
  const bodyStart = xml.indexOf("<w:body>");
  const sectionStart = xml.lastIndexOf("<w:sectPr");
  if (bodyStart < 0 || sectionStart < 0) {
    throw templateError("не найдены <w:body> или параметры раздела (sectPr)");
  }
  const sheetStart = bodyStart + "<w:body>".length;

  // Состав комиссии — один на все листы
  const layout = fitCommissionLayout(model.courseName, commission);
  const sheetTpl = applyCommission(
    xml.slice(sheetStart, sectionStart),
    commission,
    layout.removedSpacers,
  );

  // Кегль названия курса — один на все листы; меньше он становится только на листе,
  // где ФИО или должность заняли больше одной строки
  const personSizePt = PERSON_HALF_PT / 2;

  const sheets = model.students.map((student, i) => {
    const extraPersonLines =
      countWrappedLines(student.fullName, personSizePt, PERSON_TEXT_WIDTH_PT) -
      1 +
      (countWrappedLines(student.position, personSizePt, PERSON_TEXT_WIDTH_PT) - 1);
    const courseHalfPt = fitCourseHalfPt(model.courseName, extraPersonLines, layout.extraPt);

    const sheet = fillMarkedFields(sheetTpl, [
      { text: student.fullName },
      { text: student.position },
      courseHalfPt < COURSE_HALF_PT
        ? { text: model.courseName, halfPt: courseHalfPt }
        : { text: model.courseName },
    ]);
    return i > 0 ? startOnNewPage(sheet) : sheet;
  });

  zip.file(
    "word/document.xml",
    xml.slice(0, sheetStart) + sheets.join("") + xml.slice(sectionStart),
  );
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
