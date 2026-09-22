/**
 * «Ведомость проведения контроля знаний» — печатная роспись для фиксации результатов
 * проверок знаний (checkpoint/экзамен) слушателей группы по дисциплинам, по образцу
 * «Ведомость AOP-01PK.docx».
 *
 * Собирается из утверждённого шаблона server/assets/templates/assessment-sheet-template.docx
 * правкой XML «на месте» (pizzip), как и «Пустой журнал» (см. emptyJournalService.ts):
 * шрифты, рамки, автонумерация и блок подписей ответственных лиц остаются точно такими,
 * как в шаблоне. Подставляются поля, помеченные в шаблоне жёлтым маркером: курс, группа,
 * дисциплины с датами их контроля, слушатели — по одной колонке на каждый «контроль знаний»
 * (schedule_events.event_type = 'assessment') в расписании группы, а если он ещё не назначен —
 * по дисциплинам курса с проверкой знаний в программе (assessment_hours > 0), с пустой датой
 * для заполнения от руки (см. loadAssessmentSheetModel).
 *
 * Ячейка балла — уже выставленная оценка (лучшая из grades по дисциплине, включая пересдачи),
 * если она есть, иначе пусто — для заполнения от руки, если контроль ещё не проведён/не оценён
 * (ровно как в присланном образце, где дата уже вписана, а баллы — нет). «Итого, %» всегда пусто.
 *
 * Блок подписей («Ответственный специалист (оператор): …», «Проверил: …») — фиксированные
 * должности и ФИО из шаблона (аналогично DEFAULT_APPROVER_NAME в schedule/export.get.ts);
 * при смене ответственных лиц шаблон нужно поправить вручную.
 */

import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import PizZip from "pizzip";
import fontkit from "@pdf-lib/fontkit";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { formatPersonName, chunk } from "./emptyJournalService";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "assessment-sheet-template.docx",
);

/**
 * Суммарная ширина колонок дисциплин в шаблоне (twips): 2247 + 2642 — пул, который делится
 * поровну между фактическим числом дисциплин. Остальные колонки (№, ФИО, Итого) неизменны.
 */
const DISCIPLINE_POOL_TW = 2247 + 2642;
const MIN_DISCIPLINE_COL_TW = 650;
/** Ячейка заголовка дисциплины/даты не выше этого числа строк — длинные названия обрезаются («…») */
const MAX_HEADER_LINES = 2;
/**
 * Больше стольких дисциплин в одной таблице колонки становятся нечитаемыми (короткие
 * аббревиатуры не отличить друг от друга) — при бо́льшем числе дисциплин бланк разбивается
 * на несколько таблиц по MAX_DISCIPLINES_PER_BLOCK колонок, каждая на отдельной странице,
 * с полным списком слушателей и подписями — как несколько отдельных бланков под один файл.
 */
export const MAX_DISCIPLINES_PER_BLOCK = 3;

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface AssessmentSheetDiscipline {
  name: string;
  /** Как в бланке: «10.09.2026»; пусто, если контроль ещё не назначен в расписании */
  date: string;
  isRetake: boolean;
}

export interface AssessmentSheetModel {
  groupCode: string;
  courseName: string;
  disciplines: AssessmentSheetDiscipline[];
  /** «Фамилия Имя» слушателей в алфавитном порядке (как в шаблоне) */
  students: string[];
  /** scores[i][j] — балл i-го слушателя по j-й дисциплине (уже выставленный), null — ещё нет */
  scores: (number | null)[][];
}

interface GroupRow extends RowDataPacket {
  code: string;
  course_id: string | null;
  course_name: string | null;
}

interface DisciplineEventRow extends RowDataPacket {
  discipline_id: string;
  discipline_name: string | null;
  day: string;
}

interface CourseDisciplineRow extends RowDataPacket {
  id: string;
  name: string;
}

interface GradeRow extends RowDataPacket {
  student_id: string;
  discipline_id: string;
  best_grade: number | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function formatDdMmYyyy(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Собирает данные бланка. null — группа не найдена.
 *
 * Дисциплины — по событиям расписания с event_type='assessment' (контроль знаний/экзамен),
 * по одной колонке на дисциплину (не на событие): пересдачи (original_event_id не пусто) —
 * той же колонки дисциплины, а не отдельная колонка, иначе при нескольких пересдачах бланк
 * распухает на пустом месте — колонка для одного-двух пересдавших студентов среди всей группы.
 * Дата в шапке — дата первого (исходного) проведения; балл — лучший из выставленных студенту
 * по этой дисциплине (исходный контроль или любая из пересдач).
 *
 * Пока у группы ни один контроль знаний в расписании не назначен (обычное дело — так у
 * большинства групп на момент разработки), даты и баллы неоткуда взять, но дисциплины известны
 * заранее: тогда колонки берутся из дисциплин курса группы с assessment_hours > 0 (в них по
 * программе предусмотрена проверка знаний), дата и баллы остаются пустыми — заполняются от
 * руки, когда контроль назначат и проведут.
 */
export async function loadAssessmentSheetModel(
  groupId: string,
): Promise<AssessmentSheetModel | null> {
  const groupRows = await executeQuery<GroupRow[]>(
    `SELECT g.code, g.course_id, c.name AS course_name
     FROM study_groups g
     LEFT JOIN courses c ON c.id = g.course_id
     WHERE g.id = ?
     LIMIT 1`,
    [groupId],
  );
  const group = groupRows[0];
  if (!group) return null;

  const [disciplineRows, studentRows] = await Promise.all([
    executeQuery<DisciplineEventRow[]>(
      `SELECT se.discipline_id,
              d.name AS discipline_name,
              DATE_FORMAT(
                COALESCE(
                  MIN(CASE WHEN se.original_event_id IS NULL THEN se.start_time END),
                  MIN(se.start_time)
                ),
                '%Y-%m-%d'
              ) AS day
       FROM schedule_events se
       LEFT JOIN disciplines d ON d.id = se.discipline_id
       WHERE se.group_id = ? AND se.event_type = 'assessment'
       GROUP BY se.discipline_id, d.name
       ORDER BY MIN(se.start_time)`,
      [groupId],
    ),
    executeQuery<RowDataPacket[]>(
      `SELECT s.id, s.full_name
       FROM study_group_students sgs
       JOIN students s ON s.id = sgs.student_id
       WHERE sgs.group_id = ?
       ORDER BY s.full_name`,
      [groupId],
    ),
  ]);

  let disciplines: AssessmentSheetDiscipline[] = disciplineRows.map((r) => ({
    name: r.discipline_name ?? "Дисциплина",
    date: formatDdMmYyyy(r.day),
    isRetake: false,
  }));
  let disciplineIds = disciplineRows.map((r) => r.discipline_id);

  if (disciplines.length === 0 && group.course_id) {
    const courseDisciplines = await executeQuery<CourseDisciplineRow[]>(
      `SELECT id, name FROM disciplines
       WHERE course_id = ? AND assessment_hours > 0
       ORDER BY order_index`,
      [group.course_id],
    );
    disciplines = courseDisciplines.map((r) => ({
      name: r.name,
      date: "", // контроль ещё не назначен в расписании — дата вписывается от руки
      isRetake: false,
    }));
    disciplineIds = courseDisciplines.map((r) => r.id);
  }

  const gradeRows =
    disciplineIds.length > 0
      ? await executeQuery<GradeRow[]>(
          `SELECT g.student_id, se.discipline_id, MAX(g.grade) AS best_grade
           FROM grades g
           JOIN schedule_events se ON se.id = g.schedule_event_id
           WHERE se.group_id = ? AND se.event_type = 'assessment'
           GROUP BY g.student_id, se.discipline_id`,
          [groupId],
        )
      : [];
  const gradeByKey = new Map<string, number>(
    gradeRows
      .filter((r) => r.best_grade !== null)
      .map((r) => [`${r.student_id}:${r.discipline_id}`, r.best_grade as number]),
  );

  // students/scores строятся вместе, чтобы индексы не разъехались, если у кого-то имя
  // после форматирования оказалось пустым и его пришлось пропустить
  const students: string[] = [];
  const scores: (number | null)[][] = [];
  for (const s of studentRows) {
    const name = formatPersonName(String(s.full_name ?? ""));
    if (!name) continue;
    students.push(name);
    scores.push(disciplineIds.map((discId) => gradeByKey.get(`${s.id}:${discId}`) ?? null));
  }

  return {
    groupCode: group.code,
    courseName: group.course_name ?? "",
    disciplines,
    students,
    scores,
  };
}

/** Равномерное распределение пула ширин дисциплин по N колонкам, с добором остатка в последнюю */
export function disciplineColumnWidths(n: number): number[] {
  if (n <= 0) return [];
  const natural = Math.floor(DISCIPLINE_POOL_TW / n);
  const width = Math.max(natural, MIN_DISCIPLINE_COL_TW);
  const widths = Array<number>(n).fill(width);
  if (width === natural) {
    widths[n - 1]! += DISCIPLINE_POOL_TW - width * n;
  }
  return widths;
}

/**
 * Переносит текст по словам в пределах maxLines строк шириной maxWidth; если слов больше,
 * чем помещается, остаток стягивается в последнюю строку и обрезается символ за символом
 * до «…» (аналог сокращения длинных названий дисциплин в выгрузке расписания в Excel).
 * Слово, которое само по себе шире maxWidth (например, дата без пробелов), не разбивается —
 * остаётся как есть на своей строке.
 */
/** Режет одно слово на куски, каждый из которых умещается в maxWidth (для узких колонок) */
function splitWordToFit(word: string, measure: (s: string) => number, maxWidth: number): string[] {
  if (measure(word) <= maxWidth) return [word];
  const parts: string[] = [];
  let part = "";
  for (const ch of Array.from(word)) {
    if (part && measure(part + ch) > maxWidth) {
      parts.push(part);
      part = "";
    }
    part += ch;
  }
  if (part) parts.push(part);
  return parts;
}

export function wrapWithEllipsis(
  text: string,
  measure: (s: string) => number,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  // Слово шире колонки (обычная ситуация для узких колонок с длинными терминами) режется на
  // куски заранее — дальше алгоритм пакует токены, зная, что каждый по отдельности помещается.
  const tokens: { text: string; newWord: boolean }[] = [];
  for (const word of words) {
    splitWordToFit(word, measure, maxWidth).forEach((part, i) =>
      tokens.push({ text: part, newWord: i === 0 }),
    );
  }

  const lines: string[] = [];
  let i = 0;
  while (i < tokens.length && lines.length < maxLines) {
    let line = tokens[i]!.text;
    i += 1;
    while (i < tokens.length) {
      const candidate = line + (tokens[i]!.newWord ? " " : "") + tokens[i]!.text;
      if (measure(candidate) > maxWidth) break;
      line = candidate;
      i += 1;
    }
    lines.push(line);
  }

  if (i < tokens.length) {
    const lastIndex = lines.length - 1;
    let candidate = lines[lastIndex]!;
    for (let k = i; k < tokens.length; k++) {
      candidate += (tokens[k]!.newWord ? " " : "") + tokens[k]!.text;
    }
    while (candidate.length > 1 && measure(`${candidate}…`) > maxWidth) {
      candidate = candidate.slice(0, -1);
    }
    lines[lastIndex] = `${candidate.trimEnd()}…`;
  }
  return lines;
}

/**
 * Измеряет ширину текста шрифтом Montserrat Bold (тем же, что в шапке таблицы шаблона) —
 * только для расчёта переноса/обрезки заголовков дисциплин, без встраивания в документ.
 */
let boldMeasureFont: ReturnType<typeof fontkit.create> | null = null;
export function measureBold(text: string, sizePt: number): number {
  if (!boldMeasureFont) {
    const fontPath = path.join(process.cwd(), "server", "assets", "fonts", "Montserrat-700.ttf");
    boldMeasureFont = fontkit.create(readFileSync(fontPath));
  }
  const font = boldMeasureFont;
  const glyphs = font.layout(text).glyphs;
  let width = 0;
  for (const g of glyphs) width += g.advanceWidth;
  return (width * sizePt) / font.unitsPerEm;
}

/** Короче «(пересдача)», чтобы надёжнее умещаться даже в узкой (3-колоночной) шапке */
export const RETAKE_LABEL = "(пересд.)";

/**
 * Строки заголовка колонки дисциплины: название дисциплины (обрезается с «…», если не
 * помещается) и, для пересдачи, отдельная гарантированная последняя строка с пометкой —
 * «какая это дисциплина» важнее «весь текст названия», а с меткой отличить исходный контроль
 * от пересдачи можно и по дате, поэтому в первую очередь жертвуем названием, а не меткой.
 * Общий помощник для Word (assessmentSheetService) и PDF (assessmentSheetPdfService).
 */
export function disciplineHeaderLines(
  d: Pick<AssessmentSheetDiscipline, "name" | "isRetake">,
  measure: (s: string) => number,
  maxWidth: number,
): string[] {
  if (!d.isRetake) return wrapWithEllipsis(d.name, measure, maxWidth, MAX_HEADER_LINES);
  const nameLines = wrapWithEllipsis(d.name, measure, maxWidth, Math.max(1, MAX_HEADER_LINES - 1));
  return [...nameLines, RETAKE_LABEL];
}

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;
const PARA_RE = /<w:p(?=[ >])[^>]*?(?<!\/)>[\s\S]*?<\/w:p>/g;
const ROW_RE = /<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g;
const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;

function templateError(problem: string): Error {
  return new Error(
    `Шаблон ведомости (assessment-sheet-template.docx) не соответствует ожидаемой структуре: ${problem}`,
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
const withoutHighlight = (rPr: string) => rPr.replace(/<w:highlight [^>]*\/>/g, "");
const makeRun = (rPr: string, text: string) =>
  `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

/**
 * Подставляет ОДНО значение в поле, помеченное в шаблоне жёлтым: группа подряд идущих
 * ранов с маркером заменяется одним раном (формат первого рана, без маркера).
 */
function fillMarkedField(xml: string, value: string, where: string): string {
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
    return makeRun(withoutHighlight(rPrOf(run)), value);
  });

  if (group !== 0) {
    throw templateError(`в «${where}» найдено полей с маркером: ${group + 1}, ожидался 1`);
  }
  return result.replace(/<w:highlight [^>]*\/>/g, "");
}

/**
 * Вставляет текст в пустую ячейку (без маркера — например, ячейку балла): формат берётся
 * из rPr знака абзаца (pPr), сам абзац у этих ячеек ровно один. Пустой text — ячейка не трогается.
 */
function fillEmptyCell(cellXml: string, text: string): string {
  if (!text) return cellXml;
  const pPr = /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(cellXml)?.[0] ?? "";
  const markRPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(pPr)?.[0] ?? "";
  return cellXml.replace("</w:p>", `${makeRun(markRPr, text)}</w:p>`);
}

function setCellWidth(cellXml: string, widthTw: number): string {
  if (!/<w:tcW w:w="\d+"/.test(cellXml)) {
    throw templateError("в ячейке нет <w:tcW> для установки ширины");
  }
  return cellXml.replace(/<w:tcW w:w="\d+"/, `<w:tcW w:w="${widthTw}"`);
}

function setCellSpan(cellXml: string, span: number): string {
  return /<w:gridSpan w:val="\d+"\/>/.test(cellXml)
    ? cellXml.replace(/<w:gridSpan w:val="\d+"\/>/, `<w:gridSpan w:val="${span}"/>`)
    : cellXml.replace(/(<w:tcW[^/]*\/>)/, `$1<w:gridSpan w:val="${span}"/>`);
}

function cellsOf(rowXml: string): string[] {
  return [...rowXml.matchAll(CELL_RE)].map((m) => m[0]);
}

function replaceCells(rowXml: string, newCells: string[]): string {
  const open = rowXml.slice(0, rowXml.indexOf("<w:tc>"));
  return open + newCells.join("") + "</w:tr>";
}

/**
 * Строит блок «Дисциплина: … / дата проведения: …» и строку слушателя по числу реальных
 * дисциплин (по образцу — 2 колонки, но их может быть любое число, см. MAX_DISCIPLINES_PER_BLOCK).
 */
function renderTable(
  tableXml: string,
  disciplines: AssessmentSheetDiscipline[],
  students: string[],
  scores: (number | null)[][],
  numId: number,
): string {
  const gridStart = tableXml.indexOf("<w:tblGrid>");
  const tblPrPart = tableXml.slice(0, gridStart);

  const rows = [...tableXml.matchAll(ROW_RE)].map((m) => m[0]);
  if (rows.length !== 4) {
    throw templateError(`в таблице ${rows.length} строк, ожидалось 4`);
  }
  const [captionRow, dateRow, ballHeaderRow, studentProto] = rows as [
    string,
    string,
    string,
    string,
  ];

  const widths = disciplineColumnWidths(disciplines.length);
  const disciplinePool = widths.reduce((a, b) => a + b, 0);
  const ITOGO_TW = 2117;
  const NUM_TW = 509;
  const NAME_TW = 3318;
  const CELL_PAD_X_TW = 108; // поля ячейки слева/справа (tblCellMar таблицы)

  /** Обрезает текст под реальную ширину колонки (см. wrapWithEllipsis) — Word сам перенесёт остаток по словам */
  const fitHeaderText = (text: string, widthTw: number) =>
    wrapWithEllipsis(
      text,
      (s) => measureBold(s, 12),
      (widthTw - 2 * CELL_PAD_X_TW) / 20,
      MAX_HEADER_LINES,
    ).join(" ");

  // --- строка «Дисциплина: (значение) (значение) … Итого, %» ---
  const captionCells = cellsOf(captionRow);
  if (captionCells.length !== 4) throw templateError("в строке дисциплин не 4 ячейки");
  const disciplineCells = disciplines.map((d, i) => {
    const label = disciplineHeaderLines(
      d,
      (s) => measureBold(s, 12),
      (widths[i]! - 2 * CELL_PAD_X_TW) / 20,
    ).join(" ");
    return setCellWidth(
      fillMarkedField(captionCells[1]!, label, `дисциплина #${i + 1}`),
      widths[i]!,
    );
  });
  const newCaptionRow = replaceCells(captionRow, [
    captionCells[0]!,
    ...disciplineCells,
    captionCells[3]!,
  ]);

  // --- строка «дата проведения: … » ---
  const dateCells = cellsOf(dateRow);
  if (dateCells.length !== 4) throw templateError("в строке дат не 4 ячейки");
  const newDateCells = disciplines.map((d, i) =>
    setCellWidth(
      fillMarkedField(dateCells[1]!, fitHeaderText(d.date, widths[i]!), `дата дисциплины #${i + 1}`),
      widths[i]!,
    ),
  );
  const newDateRow = replaceCells(dateRow, [dateCells[0]!, ...newDateCells, dateCells[3]!]);

  // --- строка «№ | Ф.И.О. слушателя | Балл, %» — «Балл, %» растягивается на все колонки ---
  const ballCells = cellsOf(ballHeaderRow);
  if (ballCells.length !== 3) throw templateError("в строке заголовка баллов не 3 ячейки");
  const ballCell = setCellWidth(
    setCellSpan(ballCells[2]!, disciplines.length + 1),
    disciplinePool + ITOGO_TW,
  );
  const newBallRow = replaceCells(ballHeaderRow, [ballCells[0]!, ballCells[1]!, ballCell]);

  // --- строки слушателей: по образцу первой строки шаблона, с N пустыми колонками баллов ---
  const studentTplCells = cellsOf(studentProto);
  if (studentTplCells.length !== 5) throw templateError("в строке слушателя не 5 ячеек");
  const [numCellTpl, nameCellTpl, scoreCellTpl, , itogoCellTpl] = studentTplCells as [
    string,
    string,
    string,
    string,
    string,
  ];
  const numCell = numCellTpl.replace(/(<w:numId w:val=")\d+("\/>)/, `$1${numId}$2`);
  const studentRows = students.map((name, si) => {
    const nameCell = fillMarkedField(nameCellTpl, name, "ФИО слушателя");
    const scoreCells = widths.map((w, di) => {
      const score = scores[si]?.[di];
      const cell = score !== null && score !== undefined ? fillEmptyCell(scoreCellTpl, String(score)) : scoreCellTpl;
      return setCellWidth(cell, w);
    });
    return replaceCells(studentProto, [numCell, nameCell, ...scoreCells, itogoCellTpl]);
  });

  const newGrid =
    "<w:tblGrid>" +
    [NUM_TW, NAME_TW, ...widths, ITOGO_TW].map((w) => `<w:gridCol w:w="${w}"/>`).join("") +
    "</w:tblGrid>";
  const newTblPr = tblPrPart.replace(
    /<w:tblW w:w="\d+"/,
    `<w:tblW w:w="${NUM_TW + NAME_TW + disciplinePool + ITOGO_TW}"`,
  );

  return (
    newTblPr +
    newGrid +
    newCaptionRow +
    newDateRow +
    newBallRow +
    studentRows.join("") +
    "</w:tbl>"
  );
}

/** Абзац с разрывом страницы (обычный Normal-абзац, без дополнительного форматирования) */
const PAGE_BREAK_PARAGRAPH = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

export async function renderAssessmentSheetDocx(
  model: AssessmentSheetModel,
): Promise<Buffer> {
  if (model.disciplines.length === 0) {
    throw new Error(
      "У группы нет ни одного контроля знаний в расписании, ни дисциплин с проверкой знаний в программе курса — печатать нечего",
    );
  }

  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  const numberingFile = zip.file("word/numbering.xml");
  if (!docFile || !numberingFile) {
    throw templateError("нет word/document.xml или word/numbering.xml");
  }

  let xml = docFile
    .asText()
    .replace(/<w:proofErr [^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "")
    .replace(/ w14:(?:paraId|textId)="[^"]*"/g, "")
    .replace(/ w:rsid[A-Za-z]*="[^"]*"/g, "");
  let numbering = numberingFile.asText();

  const tableStart = xml.indexOf("<w:tbl>");
  const tableEnd = xml.indexOf("</w:tbl>") + "</w:tbl>".length;
  if (tableStart < 0) throw templateError("не найдена таблица дисциплин/слушателей");

  // <w:document ...><w:body> — ровно один раз, в самом начале; не часть повторяемого блока
  const bodyStart = xml.indexOf("<w:body>");
  if (bodyStart < 0) throw templateError("не найден <w:body>");
  const documentPreamble = xml.slice(0, bodyStart + "<w:body>".length);

  const headTpl = xml.slice(bodyStart + "<w:body>".length, tableStart);
  const table = xml.slice(tableStart, tableEnd);
  const tail = xml.slice(tableEnd); // блок подписей (TBL7) и хвост документа

  const paragraphCount = [...headTpl.matchAll(PARA_RE)].length;
  if (paragraphCount !== 6) {
    throw templateError(`перед таблицей ${paragraphCount} абзацев, ожидалось 6`);
  }

  const sigStart = tail.indexOf("<w:tbl>");
  const sigEnd = tail.indexOf("</w:tbl>", sigStart) + "</w:tbl>".length;
  if (sigStart < 0) throw templateError("не найден блок подписей (вторая таблица)");
  const preSignature = tail.slice(0, sigStart); // обычно пусто
  const signatureBlock = preSignature + tail.slice(sigStart, sigEnd);
  const documentEnd = tail.slice(sigEnd); // финальный абзац + sectPr — ровно один раз, в самом конце

  // --- автонумерация слушателей: у каждого блока своя (с 1), как в «Пустом журнале» ---
  const templateNumId = Number(/<w:numId w:val="(\d+)"/.exec(table)?.[1]);
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

  // Правит абзацы шапки «на месте» (P0 title, P1 subtitle, P2 название курса, P3 удаляется —
  // Word сам перенесёт название курса на нужное число строк внутри одного абзаца P2, второй
  // заготовленный под перенос вручную абзац избыточен, P4 группа, P5 пустая строка), не трогая
  // ничего вокруг них (декларацию документа, <w:body> и т.д.)
  const renderHead = () => {
    let paraIndex = -1;
    return headTpl.replace(PARA_RE, (p) => {
      paraIndex += 1;
      if (paraIndex === 2) return fillMarkedField(p, model.courseName, "название курса");
      if (paraIndex === 3) return "";
      if (paraIndex === 4) return fillMarkedField(p, model.groupCode, "код группы");
      return p;
    });
  };

  const disciplineChunks = chunk(model.disciplines, MAX_DISCIPLINES_PER_BLOCK);
  const newNums: string[] = [];
  const blocks = disciplineChunks.map((disciplines, i) => {
    let numId = templateNumId;
    if (i > 0) {
      numId = maxNumId + i;
      newNums.push(
        `<w:num w:numId="${numId}"><w:abstractNumId w:val="${abstractNumId}"/>` +
          `<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`,
      );
    }
    const colOffset = i * MAX_DISCIPLINES_PER_BLOCK;
    const chunkScores = model.scores.map((row) =>
      row.slice(colOffset, colOffset + disciplines.length),
    );
    return (
      (i > 0 ? PAGE_BREAK_PARAGRAPH : "") +
      renderHead() +
      renderTable(table, disciplines, model.students, chunkScores, numId) +
      signatureBlock
    );
  });

  if (newNums.length > 0) {
    const lastNumEnd = numbering.lastIndexOf("</w:num>") + "</w:num>".length;
    numbering =
      numbering.slice(0, lastNumEnd) + newNums.join("") + numbering.slice(lastNumEnd);
  }

  zip.file("word/document.xml", documentPreamble + blocks.join("") + documentEnd);
  zip.file("word/numbering.xml", numbering);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
