/**
 * «Оценочные листы (тест)» (BAHOLASH VARAQASI, компьютерный тест) учебной группы — по одному
 * листу на слушателя, все листы в одном Word-файле, по образцу
 * «AB-SAB-01PK Оценочные листы (тест).docx».
 *
 * Собирается из шаблона server/assets/templates/evaluation-sheets-test-template.docx правкой
 * XML «на месте» (pizzip), как и «устные» оценочные листы (см. evaluationSheetsService.ts, откуда
 * берутся общие помощники): в шаблоне один лист, он размножается по числу слушателей — каждый
 * следующий с новой страницы. Подставляется:
 *  - ФИО слушателя полностью и его должность на узбекском (students.position_uz, а если она
 *    не заполнена — position);
 *  - название программы после постоянной строки «Yakuniy imtihon (kompyuterda test sinovi).»
 *    (courses.name_uz, а если оно не заполнено — name);
 *  - оценка за экзамен и дата сдачи — по последнему завершённому тесту слушателя в группе
 *    (test_sessions.grade и completed_at); нет результата — поля остаются пустыми для
 *    заполнения от руки;
 *  - состав комиссии, который пользователь вводит при скачивании: председатель (в таблице оценок
 *    — как введено, в подписях — сокращённо) и члены комиссии (как введено).
 *
 * Лист образца занимает страницу почти целиком, поэтому при длинном названии программы или
 * большом составе комиссии кегль названия программы уменьшается ровно настолько, чтобы лист
 * остался одной страницей.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import {
  CELL_RE,
  COURSE_HALF_PT,
  COURSE_TEXT_WIDTH_PT,
  LINE_HEIGHT,
  MIN_COURSE_HALF_PT,
  PAGE_SLACK_PT,
  PARAGRAPH_RE,
  ROW_RE,
  RUN_RE,
  SIGNER_LINE_PT,
  TABLE_RE,
  collapseSpaces,
  countWrappedLines,
  fitHalfPt,
  fitSignerName,
  formatFullName,
  labelKey,
  makeRun,
  rPrOf,
  replaceRows,
  setCellText,
  setParagraphText,
  startOnNewPage,
  templateError as baseTemplateError,
  withFontSize,
  CHAIRMAN_HALF_PT,
  CHAIRMAN_TEXT_WIDTH_PT,
  MIN_CHAIRMAN_HALF_PT,
} from "./evaluationSheetsService";
import {
  abbreviateFullName,
  type EvaluationSheetsCommission,
} from "../../shared/utils/evaluationSheets";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "evaluation-sheets-test-template.docx",
);

const templateError = (problem: string) =>
  new Error(
    baseTemplateError(problem).message.replace(
      "evaluation-sheets-template.docx",
      "evaluation-sheets-test-template.docx",
    ),
  );

/** Состав комиссии для тестовых листов: председатель и члены (заместителя в образце нет) */
export type EvaluationSheetsTestCommission = Pick<
  EvaluationSheetsCommission,
  "chairman" | "members"
>;

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface EvaluationSheetsTestStudent {
  /** Как в бланке: «Hamrayeva Sarvinoz Mansur qizi» */
  fullName: string;
  /** Должность на узбекском; пусто — строка остаётся для заполнения от руки */
  position: string;
  /** Оценка за экзамен; пусто — нет результата теста */
  grade: string;
  /** Дата сдачи экзамена (YYYY-MM-DD); пусто — нет результата теста */
  examDate: string;
}

export interface EvaluationSheetsTestModel {
  groupCode: string;
  /** Название программы группы (на узбекском, если оно задано в карточке программы) */
  courseName: string;
  /** Слушатели в алфавитном порядке — по листу на каждого */
  students: EvaluationSheetsTestStudent[];
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
  grade: number | null;
  completed_date: string | null;
}

/** Собирает данные листов. null — группа не найдена. */
export async function loadEvaluationSheetsTestModel(
  groupId: string,
): Promise<EvaluationSheetsTestModel | null> {
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

  // Результат экзамена — последний завершённый (с оценкой) тест слушателя среди тестов группы
  const studentRows = await executeQuery<StudentRow[]>(
    `SELECT s.full_name, s.position, s.position_uz, ts.grade,
            DATE_FORMAT(ts.completed_at, '%Y-%m-%d') AS completed_date
     FROM study_group_students sgs
     JOIN students s ON s.id = sgs.student_id
     LEFT JOIN test_sessions ts ON ts.id = (
       SELECT ts2.id
       FROM test_sessions ts2
       JOIN test_assignments ta ON ta.id = ts2.assignment_id
       WHERE ta.group_id = sgs.group_id
         AND ts2.student_id = s.id
         AND ts2.status = 'completed'
         AND ts2.is_preview = 0
         AND ts2.grade IS NOT NULL
       ORDER BY ts2.completed_at DESC
       LIMIT 1
     )
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
        grade: s.grade !== null && s.grade !== undefined ? String(s.grade) : "",
        examDate: s.completed_date ?? "",
      }))
      .filter((s) => s.fullName),
  };
}

// ============================================================================
// ДАТА
// ============================================================================

/** «2026-11-07» → «“07”_11_2026-yil» (как в образце); нет даты — пустой бланк «“__”_____20__-yil» */
export function formatExamDate(ymd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return "“__”_____20__-yil";
  return `“${match[3]}”_${match[2]}_${match[1]}-yil`;
}

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

/** Высота строки названия программы — как в образце (10 pt) */
const COURSE_SIZE_PT = COURSE_HALF_PT / 2;
/** Постоянная часть ячейки: «Yakuniy imtihon (kompyuterda test sinovi).» и перенос строки */
const COURSE_PREFIX = "Yakuniy imtihon (kompyuterda test sinovi).";
/** Члены комиссии в образце: двое */
const TEMPLATE_MEMBERS = 2;
const MAX_MEMBERS = 5;

/** Подпись строки таблицы подписей в шаблоне (первая колонка) */
const SIGNER_ROW_LABELS = ["komissiyaraisi:", "", "komissiyaazolari:", "", "", ""];
const CHAIRMAN_COLUMN_LABEL = "komissiyaraisiningfish";
const CHAIRMAN_LABEL = "komissiyaraisi:";

/**
 * Кегль названия программы, при котором лист остаётся одной страницей: в образце постоянная
 * строка и название вместе занимают столько же места, сколько в нём занимает образец названия;
 * каждый член комиссии сверх двух съедает пару строк подписи.
 */
function fitCourseHalfPt(
  courseName: string,
  sampleLines: number,
  extraPersonLines: number,
  commissionExtraPt: number,
): number {
  const budgetPt =
    sampleLines * COURSE_SIZE_PT * LINE_HEIGHT +
    PAGE_SLACK_PT -
    extraPersonLines * 12 * LINE_HEIGHT -
    commissionExtraPt;

  for (let halfPt = COURSE_HALF_PT; halfPt > MIN_COURSE_HALF_PT; halfPt--) {
    const sizePt = halfPt / 2;
    const lines =
      countWrappedLines(COURSE_PREFIX, sizePt, COURSE_TEXT_WIDTH_PT) +
      countWrappedLines(courseName, sizePt, COURSE_TEXT_WIDTH_PT);
    if (lines * sizePt * LINE_HEIGHT <= budgetPt) return halfPt;
  }
  return MIN_COURSE_HALF_PT;
}

/** Заменяет весь текст абзаца одним раном в формате его первого рана */
function replaceParagraphRuns(paragraph: string, text: string, halfPt?: number): string {
  const runs = Array.from(paragraph.matchAll(RUN_RE));
  const first = runs[0];
  const last = runs[runs.length - 1];
  if (!first || !last) return paragraph;
  const rPr = rPrOf(first[0]);
  return (
    paragraph.slice(0, first.index) +
    makeRun(halfPt ? withFontSize(rPr, halfPt) : rPr, text) +
    paragraph.slice(last.index + last[0].length)
  );
}

/** Ячейка «Fan (modul) nomi»: после переноса строки вместо образца названия — название программы */
function setCourseCell(cell: string, courseName: string, halfPt: number): string {
  if (!courseName) return cell;
  const runs = Array.from(cell.matchAll(RUN_RE));
  const breakIndex = runs.findIndex((run) => run[0].includes("<w:br/>"));
  const first = runs[breakIndex + 1];
  const last = runs[runs.length - 1];
  if (breakIndex < 0 || !first || !last) {
    throw templateError("в ячейке «Fan (modul) nomi» после строки «Yakuniy imtihon» ожидался перенос строки и название курса");
  }
  const rPr = withFontSize(rPrOf(first[0]), halfPt);
  const prefix = cell
    .slice(0, first.index)
    // постоянная строка тоже ужимается вместе с названием
    .replace(RUN_RE, (run) => (run.includes("<w:t") ? withFontSize(run, halfPt) : run));
  return prefix + makeRun(rPr, courseName) + cell.slice(last.index + last[0].length);
}

/** Строка данных таблицы оценок: программа, оценка, председатель, дата */
function fillGradesRow(
  row: string,
  opts: {
    courseName: string;
    courseHalfPt: number;
    grade: string;
    chairman: string;
    chairmanHalfPt: number;
    date: string;
  },
): string {
  let i = -1;
  return row.replace(CELL_RE, (cell) => {
    i += 1;
    switch (i) {
      case 1:
        return setCourseCell(cell, opts.courseName, opts.courseHalfPt);
      case 2: {
        // перед оценкой в ячейке стоит перенос строки — он остаётся
        const gradeText = /<w:t(?: [^>]*)?>[^<]*<\/w:t>/;
        if (!gradeText.test(cell)) throw templateError("в ячейке «Baho» не найдено место для оценки");
        // перенос строки перед оценкой в образце убираем — оценка стоит в одной строке с ячейкой
        return cell
          .replace(RUN_RE, (run) => (run.includes("<w:br/>") ? "" : run))
          .replace(gradeText, () => `<w:t>${opts.grade}</w:t>`);
      }
      case 3:
        return cell.replace(PARAGRAPH_RE, (p) =>
          setParagraphText(p, opts.chairman, opts.chairmanHalfPt),
        );
      case 4: {
        // дата — в первом абзаце ячейки, ниже стоят пустая строка и линия для подписи
        let done = false;
        return cell.replace(PARAGRAPH_RE, (p) => {
          if (done || !/<w:t[ >]/.test(p)) return p;
          done = true;
          return replaceParagraphRuns(p, opts.date);
        });
      }
      default:
        return cell;
    }
  });
}

/** Таблица подписей: председатель и члены комиссии парами «ФИО — (imzo)» */
function fillSignersTable(table: string, commission: EvaluationSheetsTestCommission): string {
  const rows = table.match(ROW_RE) ?? [];
  const labels = rows.map((row) => labelKey(row.match(CELL_RE)?.[0] ?? ""));
  if (labels.join("|") !== SIGNER_ROW_LABELS.join("|")) {
    throw templateError(
      "в таблице подписей ожидались три пары строк «ФИО — (imzo)»: «Komissiya raisi:», «Komissiya a’zolari:» и второй член комиссии",
    );
  }

  const pair = (nameRow: number, name: string) =>
    setCellText(rows[nameRow]!, 1, name, fitSignerName(name).halfPt) + rows[nameRow + 1]!;
  return replaceRows(table, rows, [
    pair(0, abbreviateFullName(commission.chairman)),
    ...commission.members.map((member, i) => pair(i === 0 ? 2 : 4, member)),
  ]);
}

/** Строка «Komissiya raisi:<табуляции>R.D. Kashayev» — подставляет председателя после табуляций */
function setClosingChairman(paragraph: string, name: string, halfPt: number): string {
  const runs = Array.from(paragraph.matchAll(RUN_RE));
  let tabRun = -1;
  runs.forEach((run, i) => {
    if (run[0].includes("<w:tab/>")) tabRun = i;
  });
  const tab = runs[tabRun];
  const last = runs[runs.length - 1];
  if (!tab || !last) throw templateError("в строке «Komissiya raisi:» под таблицей подписей нет табуляций");

  // в последнем ране с табуляцией может стоять и начало ФИО образца («<w:tab/><w:t>R.D. </w:t>») —
  // от рана остаётся только табуляция, ФИО идёт отдельным раном
  const rPr = withFontSize(rPrOf(tab[0]), halfPt);
  const tabOnly = tab[0].replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g, "");
  return (
    paragraph.slice(0, tab.index) +
    tabOnly +
    makeRun(rPr, name) +
    paragraph.slice(last.index + last[0].length)
  );
}

export async function renderEvaluationSheetsTestDocx(
  model: EvaluationSheetsTestModel,
  commission: EvaluationSheetsTestCommission,
): Promise<Buffer> {
  if (commission.members.length < 1 || commission.members.length > MAX_MEMBERS) {
    throw new Error(`Членов комиссии должно быть от 1 до ${MAX_MEMBERS}`);
  }

  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");

  // Служебные метки Word (проверка орфографии, идентификаторы абзацев) не нужны,
  // а идентификаторы после размножения листа стали бы неуникальными
  const xml = docFile
    .asText()
    .replace(/<w:proofErr [^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "")
    .replace(/ w14:(?:paraId|textId)="[^"]*"/g, "")
    .replace(/ w:rsid[A-Za-z]*="[^"]*"/g, "");

  const bodyStart = xml.indexOf("<w:body>");
  const sectionStart = xml.lastIndexOf("<w:sectPr");
  if (bodyStart < 0 || sectionStart < 0) {
    throw templateError("не найдены <w:body> или параметры раздела (sectPr)");
  }
  const sheetStart = bodyStart + "<w:body>".length;
  const sheetTpl = xml.slice(sheetStart, sectionStart);

  const tables = Array.from(sheetTpl.matchAll(TABLE_RE));
  const personTable = tables[0];
  const gradesTable = tables.find((t) => labelKey(t[0]).includes(CHAIRMAN_COLUMN_LABEL));
  const signersTable = tables.find((t) => labelKey(t[0]).startsWith(CHAIRMAN_LABEL));
  if (!personTable || !gradesTable || !signersTable || gradesTable.index > signersTable.index) {
    throw templateError(
      "ожидались таблица ФИО и должности, таблица оценок (колонка «Komissiya raisining F.I.Sh.») и под ней таблица подписей (строка «Komissiya raisi:»)",
    );
  }
  const personRows = personTable[0].match(ROW_RE) ?? [];
  const gradeRows = gradesTable[0].match(ROW_RE) ?? [];
  if (personRows.length < 3 || gradeRows.length !== 2) {
    throw templateError("таблица ФИО должна иметь три строки и более, а таблица оценок — две");
  }

  // Образец названия программы в ячейке — сколько места он занимает на листе
  const sampleCourse = Array.from(
    (gradeRows[1]!.match(CELL_RE)?.[1] ?? "").matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g),
    (m) => m[1],
  ).join("");
  const sampleLines = countWrappedLines(sampleCourse, COURSE_SIZE_PT, COURSE_TEXT_WIDTH_PT) + 1;

  // Председатель — в колонке узкой ширины: кегль уменьшается, пока каждое слово не поместится
  const chairmanHalfPt =
    fitHalfPt(
      commission.chairman.split(" "),
      CHAIRMAN_HALF_PT,
      MIN_CHAIRMAN_HALF_PT,
      CHAIRMAN_TEXT_WIDTH_PT,
    ) ?? MIN_CHAIRMAN_HALF_PT;

  // Подписи: каждый член комиссии сверх двух удлиняет лист на пару строк
  const signerNames = [abbreviateFullName(commission.chairman), ...commission.members];
  const signerLines = signerNames.reduce((sum, name) => sum + fitSignerName(name).lines + 1, 0);
  const commissionExtraPt = (signerLines - (1 + TEMPLATE_MEMBERS) * 2) * SIGNER_LINE_PT;

  // Строка «Komissiya raisi: ... ФИО» и дата под решением
  const closingChairman = abbreviateFullName(commission.chairman);
  const closingHalfPt = fitSignerName(closingChairman).halfPt;

  // Лист без данных слушателя: комиссия подставляется один раз
  const signersEnd = signersTable.index + signersTable[0].length;
  const tailTpl = sheetTpl.slice(signersEnd);
  if (!tailTpl.includes("-yil") || !/<w:tab\/>/.test(tailTpl)) {
    throw templateError("под таблицей подписей ожидались строка «Komissiya raisi:» и дата");
  }

  const sheets = model.students.map((student, index) => {
    const date = formatExamDate(student.examDate);

    const personFilled = personTable[0]
      .replace(personRows[0]!, () => setCellText(personRows[0]!, 0, student.fullName))
      .replace(personRows[2]!, () =>
        student.position ? setCellText(personRows[2]!, 0, student.position) : personRows[2]!,
      );

    const extraPersonLines =
      countWrappedLines(student.fullName, 12, (9496 - 2 * 108) / 20) -
      1 +
      (countWrappedLines(student.position, 12, (9496 - 2 * 108) / 20) - 1);
    const courseHalfPt = fitCourseHalfPt(
      model.courseName || sampleCourse,
      sampleLines,
      Math.max(0, extraPersonLines),
      commissionExtraPt,
    );

    const gradesFilled = replaceRows(gradesTable[0], gradeRows, [
      gradeRows[0]!,
      fillGradesRow(gradeRows[1]!, {
        courseName: model.courseName,
        courseHalfPt,
        grade: student.grade,
        chairman: commission.chairman,
        chairmanHalfPt,
        date,
      }),
    ]);

    let sawChairmanLine = false;
    const tail = tailTpl.replace(PARAGRAPH_RE, (paragraph) => {
      if (paragraph.includes("<w:tab/>") && labelKey(paragraph).startsWith(CHAIRMAN_LABEL)) {
        sawChairmanLine = true;
        return setClosingChairman(paragraph, closingChairman, closingHalfPt);
      }
      if (/-yil/.test(paragraph)) return replaceParagraphRuns(paragraph, date);
      return paragraph;
    });
    if (!sawChairmanLine) {
      throw templateError("под таблицей подписей не найдена строка «Komissiya raisi:» с ФИО после табуляций");
    }

    const sheet =
      sheetTpl.slice(0, personTable.index) +
      personFilled +
      sheetTpl.slice(personTable.index + personTable[0].length, gradesTable.index) +
      gradesFilled +
      sheetTpl.slice(gradesTable.index + gradesTable[0].length, signersTable.index) +
      fillSignersTable(signersTable[0], commission) +
      tail;
    return index > 0 ? startOnNewPage(sheet) : sheet;
  });

  zip.file(
    "word/document.xml",
    xml.slice(0, sheetStart) + sheets.join("") + xml.slice(sectionStart),
  );
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
