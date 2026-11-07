/**
 * «Bayonnoma (тест)» — протокол заседания комиссии итогового экзамена, проведённого в виде
 * компьютерного теста, по образцу «Bayonnoma_AX-26-18_AB-SAB-01PK_test.docx».
 *
 * Собирается из шаблона server/assets/templates/final-exam-protocol-test-template.docx правкой
 * XML «на месте» (pizzip) теми же приёмами, что и протокол устного экзамена (см.
 * finalExamProtocolService.ts, откуда берутся общие помощники). От устного протокола отличается:
 *  - таблица результатов (без колонки «Test varianti»): «Toʻgʻri javoblar soni (ball, 100 dan)»,
 *    «Baho» и «Natija» слушателей
 *    заполняются из результатов теста (test_sessions): берётся последний завершённый тест
 *    слушателя в группе; нет результата — ячейки остаются пустыми;
 *  - числа в «Roʻyxatga kiritilgan … nafar», в решении комиссии и в приложениях считаются
 *    по этим результатам; дата пересдачи и число листов («___ varaqda») остаются пустыми —
 *    их заполняют от руки;
 *  - в составе комиссии нет заместителя председателя.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { collapseSpaces, formatFullName } from "./evaluationSheetsService";
import {
  CELL_RE,
  ROW_RE,
  TABLE_RE,
  editParagraphs,
  fillHead,
  fillInfoTable,
  fillOrderOfExam,
  fillSecondPageStart,
  fillSignersTable,
  fitFirstPage,
  mapCells,
  mapParagraphs,
  replaceText,
  setText,
  splitAtSecondPage,
  type FinalExamProtocolModel,
} from "./finalExamProtocolService";
import type { FinalExamProtocolForm } from "../../shared/utils/finalExamProtocol";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "final-exam-protocol-test-template.docx",
);

const templateError = (problem: string) =>
  new Error(
    `Шаблон протокола (final-exam-protocol-test-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface ProtocolTestResult {
  /** ФИО как в шаблоне: «Avulov Rushan Feruz oʻgʻli» */
  fullName: string;
  /** Нет результата теста — оценка и баллы пустые */
  hasResult: boolean;
  /** Правильных ответов (баллов из 100) */
  points: number | null;
  /** Оценка по пятибалльной шкале */
  grade: number | null;
}

export interface FinalExamProtocolTestModel extends FinalExamProtocolModel {
  /** Результаты слушателей в том же порядке, что и students */
  results: ProtocolTestResult[];
}

/** Шкала протокола (Dasturning 89-bandi): 86–100 → 5, 71–85 → 4, 56–70 → 3, ≤55 → 2 */
export function percentToGrade(percent: number): number {
  if (percent >= 86) return 5;
  if (percent >= 71) return 4;
  if (percent >= 56) return 3;
  return 2;
}

/** Слушатель сдал, если оценка 4 и выше */
export const isPassed = (grade: number) => grade >= 4;

/** Апострофы в ФИО — как в шаблоне («Oʻktamjon», «oʻgʻli»): «‘», «’», «'» и «`» → «ʻ» */
const normalizeApostrophes = (name: string) => name.replace(/[‘’'`]/g, "ʻ");

interface GroupRow extends RowDataPacket {
  code: string;
  course_name: string | null;
  course_name_uz: string | null;
}

interface ResultRow extends RowDataPacket {
  full_name: string | null;
  score_percent: number | string | null;
  total_points: number | string | null;
  max_points: number | string | null;
}

/** Собирает данные протокола. null — группа не найдена. */
export async function loadFinalExamProtocolTestModel(
  groupId: string,
): Promise<FinalExamProtocolTestModel | null> {
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
  const rows = await executeQuery<ResultRow[]>(
    `SELECT s.full_name, ts.score_percent, ts.total_points, ts.max_points
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

  const results: ProtocolTestResult[] = rows
    .map((row) => {
      const fullName = normalizeApostrophes(formatFullName(row.full_name ?? ""));
      if (row.score_percent === null || row.score_percent === undefined) {
        return { fullName, hasResult: false, points: null, grade: null };
      }
      const percent = Number(row.score_percent);
      // «Toʻgʻri javoblar soni (ball, 100 dan)»: в тесте на 100 баллов это сумма баллов
      const points =
        Number(row.max_points) === 100 && row.total_points !== null
          ? Number(row.total_points)
          : Math.round(percent);
      return { fullName, hasResult: true, points, grade: percentToGrade(percent) };
    })
    .filter((result) => result.fullName);

  return {
    groupCode: group.code,
    courseName: collapseSpaces(group.course_name_uz) || collapseSpaces(group.course_name),
    students: results.map((result) => result.fullName),
    results,
  };
}

interface DateRow extends RowDataPacket {
  exam_date: string | null;
}

/** Дата последнего завершённого теста группы (ГГГГ-ММ-ДД) — подсказка для даты протокола */
export async function loadLastTestDate(groupId: string): Promise<string | null> {
  const rows = await executeQuery<DateRow[]>(
    `SELECT DATE_FORMAT(MAX(ts.completed_at), '%Y-%m-%d') AS exam_date
     FROM test_sessions ts
     JOIN test_assignments ta ON ta.id = ts.assignment_id
     WHERE ta.group_id = ?
       AND ts.status = 'completed'
       AND ts.is_preview = 0
       AND ts.grade IS NOT NULL`,
    [groupId],
  );
  return rows[0]?.exam_date ?? null;
}

// ============================================================================
// ТАБЛИЦА РЕЗУЛЬТАТОВ
// ============================================================================

const rPrOfParagraph = (p: string) =>
  /<w:pPr>[\s\S]*?(<w:rPr>[\s\S]*?<\/w:rPr>)<\/w:pPr>/.exec(p)?.[1] ?? "";

/** Пустая ячейка шаблона → ячейка с текстом (кегль — как у знака абзаца) */
function fillEmptyCell(cell: string, text: string): string {
  if (!text) return cell;
  return mapParagraphs(cell, (p) =>
    p.replace(
      "</w:p>",
      () =>
        `<w:r>${rPrOfParagraph(p)}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`,
    ),
  );
}

/** Строка слушателя: ФИО, баллы, оценка и результат (№ нумеруется Word автоматически) */
function fillResultRow(row: string, result: ProtocolTestResult): string {
  return mapCells(row, (cell, i) => {
    if (i === 1) return mapParagraphs(cell, (p) => setText(p, result.fullName, "ФИО в таблице"));
    if (!result.hasResult || result.grade === null || result.points === null) return cell;
    if (i === 2) return fillEmptyCell(cell, String(result.points));
    if (i === 3) return fillEmptyCell(cell, String(result.grade));
    if (i === 4) return fillEmptyCell(cell, isPassed(result.grade) ? "oʻtdi" : "oʻtmadi");
    return cell;
  });
}

function fillResultsTable(table: string, results: ProtocolTestResult[]): string {
  const rows = table.match(ROW_RE) ?? [];
  const header = rows[0];
  const sample = rows[1];
  const last = rows[rows.length - 1];
  if (!header || !sample || !last || (sample.match(CELL_RE) ?? []).length !== 6) {
    throw templateError(
      "в таблице результатов ожидались строка заголовков и строки слушателей из шести колонок (№, F.I.Sh., баллы, Baho, Natija, Izoh)",
    );
  }
  const start = table.indexOf(sample);
  const end = table.lastIndexOf(last) + last.length;
  return (
    table.slice(0, start) +
    results.map((result) => fillResultRow(sample, result)).join("") +
    table.slice(end)
  );
}

// ============================================================================
// ТЕКСТ ПОД ТАБЛИЦЕЙ: ЧИСЛА ПО РЕЗУЛЬТАТАМ
// ============================================================================

/** Подставляет числа вместо первых пропусков «___» абзаца — по порядку */
function fillBlanks(p: string, values: number[], where: string): string {
  return values.reduce((paragraph, value) => replaceText(paragraph, /___/, String(value), where), p);
}

function fillTextAfterResults(xml: string, results: ProtocolTestResult[]): string {
  const graded = results.filter((r) => r.hasResult && r.grade !== null);
  const count = (grade: number) => graded.filter((r) => r.grade === grade).length;
  const passed = graded.filter((r) => isPassed(r.grade!)).length;

  let text = editParagraphs(
    xml,
    "Roʻyxatga kiritilgan … nafar",
    (t) => /kiritilgan \d+ nafar/.test(t),
    (p) =>
      fillBlanks(
        replaceText(p, /(?<=kiritilgan )\d+/, String(results.length), "Roʻyxatga kiritilgan"),
        // imtihonga qoʻyildi, imtihonda qatnashdi, «aʼlo», «yaxshi», «qoniqarli», «qoniqarsiz»
        [results.length, graded.length, count(5), count(4), count(3), count(2)],
        "Roʻyxatga kiritilgan … nafar",
      ),
  );
  // Решение комиссии: сдавшие (5 и 4) и получившие «qoniqarli» (3); дата пересдачи — от руки
  text = editParagraphs(
    text,
    "решение: сдавшие экзамен",
    (t) => t.startsWith("Yakuniy imtihonni") && t.includes("___"),
    (p) => fillBlanks(p, [passed], "решение: сдавшие экзамен"),
  );
  text = editParagraphs(
    text,
    "решение: «qoniqarli» (3)",
    (t) => /^.Qoniqarli. \(3\) baho olgan ___ nafar/.test(t),
    (p) => fillBlanks(p, [count(3)], "решение: «qoniqarli» (3)"),
  );
  // Приложения: листы результатов теста — у участвовавших, листы оценивания — у всех из списка
  text = editParagraphs(
    text,
    "Ilova 1",
    (t) => /^1\. Tinglovchilarning kompyuter test/.test(t) && t.includes("___"),
    (p) => fillBlanks(p, [graded.length], "Ilova 1"),
  );
  return editParagraphs(
    text,
    "Ilova 2",
    (t) => /^2\. Tinglovchilarning baholash varaqalari/.test(t),
    (p) => fillBlanks(p, [results.length], "Ilova 2"),
  );
}

// ============================================================================
// СБОРКА ДОКУМЕНТА
// ============================================================================

export async function renderFinalExamProtocolTestDocx(
  model: FinalExamProtocolTestModel,
  form: FinalExamProtocolForm,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");

  // Служебные метки Word (проверка орфографии, идентификаторы абзацев) не нужны,
  // а идентификаторы после размножения строк стали бы неуникальными
  const xml = docFile
    .asText()
    .replace(/<w:proofErr [^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak\/>/g, "")
    .replace(/ w14:(?:paraId|textId)="[^"]*"/g, "")
    .replace(/ w:rsid[A-Za-z]*="[^"]*"/g, "");

  // Три таблицы: сведения об экзамене, результаты, подписи комиссии
  const tables = Array.from(xml.matchAll(TABLE_RE));
  const bodyStart = xml.indexOf("<w:body>") + "<w:body>".length;
  const [info, results, signers] = tables;
  if (!info || !results || !signers || tables.length !== 3 || bodyStart < "<w:body>".length) {
    throw templateError("ожидались три таблицы: сведения об экзамене, результаты и подписи");
  }
  const endOf = (table: RegExpMatchArray) => table.index! + table[0].length;
  const head = xml.slice(bodyStart, info.index);
  const [orderOfExam, secondPage] = splitAtSecondPage(xml.slice(endOf(info), results.index));

  const firstPage = fitFirstPage(
    head + info[0] + orderOfExam,
    fillHead(head, form) +
      fillInfoTable(info[0], model, form) +
      fillOrderOfExam(orderOfExam, model, form),
  );

  zip.file(
    "word/document.xml",
    xml.slice(0, bodyStart) +
      firstPage +
      // Разрыв страницы перед «Imtihon tasdiqlangan jadval…» уже есть в шаблоне
      fillSecondPageStart(secondPage, form) +
      fillResultsTable(results[0], model.results) +
      fillTextAfterResults(xml.slice(endOf(results), signers.index), model.results) +
      fillSignersTable(signers[0], form) +
      xml.slice(endOf(signers)),
  );
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
