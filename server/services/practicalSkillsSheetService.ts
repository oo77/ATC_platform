/**
 * «Ведомость практических работ» — Amaliy koʻnikmalarni tekshirish QAYDNOMASI
 * (по образцу «AB-SAB-01PK_Amaliy_konikmalar_qaydnomasi.docx»): по одной странице на слушателя.
 *
 * Собирается из шаблона server/assets/templates/practical-skills-sheet-template.docx правкой
 * XML «на месте» (pizzip): оформление и таблица заданий остаются как в образце. Страница-образец
 * (первые 13 блоков документа) размножается по слушателям группы; подставляются:
 *  - из базы: должность слушателя на узбекском (students.position_uz) и ФИО;
 *  - из формы (PracticalSkillsSheetForm): «Aviatsiya xavfsizligi xizmati», дата, время
 *    начала/окончания и состав комиссии (строки подписи).
 * Баллы в таблице заполняются от руки.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../utils/db";
import { formatFullName } from "./evaluationSheetsService";
import type { PracticalSkillsSheetForm } from "../../shared/utils/practicalSkillsSheet";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "practical-skills-sheet-template.docx",
);

/** Блоков (абзацев и таблиц верхнего уровня) на странице одного слушателя в шаблоне */
const PAGE_BLOCKS = 13;

export interface PracticalSkillsSheetStudent {
  /** «Hamrayeva Sarvinoz Mansur qizi» */
  fullName: string;
  /** Должность на узбекском; пусто, если не заполнена */
  position: string;
}

export interface PracticalSkillsSheetModel {
  groupCode: string;
  students: PracticalSkillsSheetStudent[];
}

interface GroupRow extends RowDataPacket {
  code: string;
}

interface StudentRow extends RowDataPacket {
  full_name: string | null;
  position: string | null;
  position_uz: string | null;
}

const collapse = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

/** Собирает данные ведомости. null — группа не найдена. */
export async function loadPracticalSkillsSheetModel(
  groupId: string,
): Promise<PracticalSkillsSheetModel | null> {
  const groupRows = await executeQuery<GroupRow[]>(
    `SELECT code FROM study_groups WHERE id = ? LIMIT 1`,
    [groupId],
  );
  const group = groupRows[0];
  if (!group) return null;

  const rows = await executeQuery<StudentRow[]>(
    `SELECT s.full_name, s.position, s.position_uz
     FROM study_group_students sgs
     JOIN students s ON s.id = sgs.student_id
     WHERE sgs.group_id = ?
     ORDER BY s.full_name`,
    [groupId],
  );

  return {
    groupCode: group.code,
    students: rows
      .map((r) => ({
        fullName: formatFullName(r.full_name ?? ""),
        position: collapse(r.position_uz) || collapse(r.position),
      }))
      .filter((s) => s.fullName),
  };
}

const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** «2026-11-06» → «06» noyabr 2026-yil */
function uzbekDate(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  return `«${String(day).padStart(2, "0")}» ${UZ_MONTHS[(month ?? 1) - 1]} ${year}-yil`;
}

// ============================================================================
// ПРАВКА XML
// ============================================================================

const RUN_RE = /<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g;

function templateError(problem: string): Error {
  return new Error(
    `Шаблон ведомости (practical-skills-sheet-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );
}

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const textOf = (xml: string) =>
  [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");

/** Блоки верхнего уровня тела: таблица целиком или абзац вне таблицы */
function splitBlocks(body: string): string[] {
  const blocks: string[] = [];
  let pos = 0;
  while (pos < body.length) {
    const m = /<w:tbl>|<w:p[ >]/.exec(body.slice(pos));
    if (!m) break;
    const start = pos + m.index;
    const end =
      m[0] === "<w:tbl>"
        ? body.indexOf("</w:tbl>", start) + "</w:tbl>".length
        : body.indexOf("</w:p>", start) + "</w:p>".length;
    blocks.push(body.slice(start, end));
    pos = end;
  }
  return blocks;
}

function replaceOnce(xml: string, from: string, to: string, what: string): string {
  if (!xml.includes(from)) throw templateError(`не найдено «${what}»`);
  return xml.replace(from, () => to);
}

/** Начиная с прогона с текстом firstRunText весь остаток абзаца заменяется одним прогоном */
function replaceTail(paragraph: string, firstRunText: string, newText: string): string {
  let cut = -1;
  let rPr = "";
  for (const m of paragraph.matchAll(RUN_RE)) {
    if (textOf(m[0]).startsWith(firstRunText)) {
      cut = m.index!;
      rPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(m[0])?.[0] ?? "";
      break;
    }
  }
  if (cut < 0) throw templateError(`не найдено «${firstRunText}»`);
  const head = paragraph.slice(0, cut).replace(/<w:proofErr [^>]*\/>$/, "");
  return `${head}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(newText)}</w:t></w:r></w:p>`;
}

function buildStudentPage(
  page: string[],
  student: PracticalSkillsSheetStudent,
  form: PracticalSkillsSheetForm,
  isFirst: boolean,
): string {
  // 0–3 заголовок, 4 служба, 5 должность и ФИО, 6 дата, 7 время, 8 таблица заданий,
  // 9 «Komissiya aʼzolari:», 10–12 строки подписи (образец — 10-я)
  let first = page[0]!.replace(/<w:lastRenderedPageBreak\/>/g, "");
  if (!isFirst) first = first.replace("<w:pPr>", "<w:pPr><w:pageBreakBefore/>");

  const service = replaceOnce(
    page[4]!,
    "<w:t>AXX</w:t>",
    `<w:t>${escapeXml(form.service)}</w:t>`,
    "AXX",
  );

  const person = replaceTail(
    page[5]!,
    "Nazoratchi",
    [student.position, student.fullName].filter(Boolean).join(", "),
  );

  const date = replaceOnce(
    page[6]!,
    "«____» ______________ 20___-yil",
    escapeXml(uzbekDate(form.date)),
    "дата проведения",
  );

  let time = replaceOnce(page[7]!, " ________; ", ` ${escapeXml(form.timeStart)}; `, "время начала");
  time = replaceOnce(time, " ________.", ` ${escapeXml(form.timeEnd)}.`, "время окончания");

  const members = form.commission
    .map((name, i) =>
      replaceTail(page[10]!, "1. ____", `${i + 1}. ____________________________ ${name}`),
    )
    .join("");

  return [first, page[1], page[2], page[3], service, person, date, time, page[8], page[9], members].join("");
}

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

export async function renderPracticalSkillsSheetDocx(
  model: PracticalSkillsSheetModel,
  form: PracticalSkillsSheetForm,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");
  const xml = docFile.asText();

  const bodyStart = xml.indexOf("<w:body>") + "<w:body>".length;
  const sectStart = xml.lastIndexOf("<w:sectPr");
  if (bodyStart < "<w:body>".length || sectStart < 0) {
    throw templateError("нет <w:body>/<w:sectPr>");
  }

  const blocks = splitBlocks(xml.slice(bodyStart, sectStart));
  if (blocks.length < PAGE_BLOCKS || !textOf(blocks[0]!).startsWith("Texnik")) {
    throw templateError("страница-образец не найдена");
  }
  const page = blocks.slice(0, PAGE_BLOCKS);

  const pages = model.students.map((student, i) => buildStudentPage(page, student, form, i === 0));

  // страницы размножены — убираем w14:paraId/textId, чтобы не было дублей
  const content = pages.join("").replace(/ w14:(?:paraId|textId)="[^"]*"/g, "");
  zip.file("word/document.xml", xml.slice(0, bodyStart) + content + xml.slice(sectStart));

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
