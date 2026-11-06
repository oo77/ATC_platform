/**
 * «Реестр» учебной группы — лист регистрации слушателей и подтверждения личности
 * (TINGLOVCHILARNI RO‘YXATGA OLISH VA SHAXSINI TASDIQLASH VARAQASI), по образцу
 * «Реестр AB-APA-04PP.docx».
 *
 * Собирается из шаблона server/assets/templates/registry-template.docx правкой XML «на месте»
 * (pizzip), как и «Оценочные листы» (см. evaluationSheetsService.ts). Оформление и постоянный
 * текст — из шаблона; подставляются:
 *  - из базы: код группы в «Kurs/guruh» и слушатели — ФИО полностью и должность на узбекском
 *    (в шаблоне одна строка слушателя, она размножается по их числу);
 *  - из формы, которую пользователь заполняет перед скачиванием (RegistryForm): дата, время,
 *    место, председатель комиссии и, если он указан, заместитель председателя.
 *
 * Места для значений ищутся по постоянным подписям шаблона («Kurs/guruh:», «Sana:»,
 * «Komissiya raisi» и т. д.); значения шаблона в них условные.
 */

import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import { loadEvaluationSheetsModel } from "./evaluationSheetsService";
import type { RegistryForm } from "../../shared/utils/registry";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "server",
  "assets",
  "templates",
  "registry-template.docx",
);

// ============================================================================
// ДАННЫЕ
// ============================================================================

export interface RegistryModel {
  groupCode: string;
  /** Слушатели в алфавитном порядке */
  students: {
    /** Как в бланке: «Agalarov Aziz Azad o‘g‘li» */
    fullName: string;
    /** Должность на узбекском (а если она не заполнена — основная); пусто — ячейка пустая */
    position: string;
  }[];
}

/**
 * Собирает данные реестра. null — группа не найдена.
 * Слушатели и их должности — те же, что в «Оценочных листах».
 */
export async function loadRegistryModel(groupId: string): Promise<RegistryModel | null> {
  const model = await loadEvaluationSheetsModel(groupId);
  return model && { groupCode: model.groupCode, students: model.students };
}

/** «2026-10-13» → «13.10.2026» */
const formatDate = (ymd: string) => ymd.split("-").reverse().join(".");

// ============================================================================
// WORD ПО ШАБЛОНУ
// ============================================================================

const TABLE_RE = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
const ROW_RE = /<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g;
const CELL_RE = /<w:tc>[\s\S]*?<\/w:tc>/g;
const PARA_RE = /<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g;
const TEXT_RE = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;

/** Подписи сведений в шапке: значение стоит в ячейке сразу после подписи */
const INFO_LABELS = ["Kurs/guruh:", "Sana:", "Vaqti:", "Joy:"] as const;
const CHAIRMAN_LABEL = "Komissiya raisi";
const DEPUTY_LABEL = "Komissiya rais o‘rinbosari";

function templateError(problem: string): Error {
  return new Error(
    `Шаблон реестра (registry-template.docx) не соответствует ожидаемой структуре: ${problem}`,
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const textOf = (xml: string) =>
  Array.from(xml.matchAll(TEXT_RE), (m) => m[1])
    .join("")
    .trim();

/** Заменяет текст с номером index (с нуля) во фрагменте — формат рана сохраняется */
function setText(xml: string, index: number, text: string, where: string): string {
  let i = -1;
  const result = xml.replace(TEXT_RE, (match) => {
    i += 1;
    return i === index ? `<w:t xml:space="preserve">${escapeXml(text)}</w:t>` : match;
  });
  if (i < index) throw templateError(`в «${where}» нет текста образца`);
  return result;
}

/** Заменяет ячейки строки (по порядку) результатом fn */
function mapCells(row: string, fn: (cell: string, index: number) => string): string {
  let i = -1;
  return row.replace(CELL_RE, (cell) => fn(cell, ++i));
}

/** Шапка: «Kurs/guruh: … Sana: … Vaqti: … Joy: …» */
function fillInfoTable(table: string, values: Record<(typeof INFO_LABELS)[number], string>) {
  let label: (typeof INFO_LABELS)[number] | undefined;
  let filled = 0;
  const result = table.replace(CELL_RE, (cell) => {
    if (label) {
      const value = values[label];
      const where = label;
      label = undefined;
      filled += 1;
      return setText(cell, 0, value, where);
    }
    label = INFO_LABELS.find((known) => known === textOf(cell));
    return cell;
  });
  if (filled !== INFO_LABELS.length) {
    throw templateError(`в шапке ожидались подписи ${INFO_LABELS.join(", ")} со значениями`);
  }
  return result;
}

/** Таблица слушателей: строка шаблона (№, ФИО, должность) — на каждого слушателя */
function fillStudentsTable(table: string, students: RegistryModel["students"]): string {
  const rows = table.match(ROW_RE) ?? [];
  const studentRow = rows[1];
  if (rows.length !== 2 || !studentRow) {
    throw templateError("в таблице слушателей ожидались шапка и одна строка слушателя");
  }
  const studentRows = students.map((student, n) =>
    mapCells(studentRow, (cell, i) => {
      const value = [String(n + 1), student.fullName, student.position][i];
      return value === undefined ? cell : setText(cell, 0, value, "строка слушателя");
    }),
  );
  const start = table.indexOf(studentRow);
  return (
    table.slice(0, start) + studentRows.join("") + table.slice(start + studentRow.length)
  );
}

/**
 * Подписи под таблицей: «Komissiya raisi <табуляции> ФИО» и такая же строка заместителя.
 * Без заместителя его строка убирается вместе с пустой строкой перед ней.
 */
function fillSignatures(xml: string, form: RegistryForm): string {
  const paragraphs = Array.from(xml.matchAll(PARA_RE));
  const find = (label: string) => paragraphs.findIndex((p) => textOf(p[0]).startsWith(label));
  const deputyIndex = find(DEPUTY_LABEL);
  const chairmanIndex = paragraphs.findIndex(
    (p, i) => i !== deputyIndex && textOf(p[0]).startsWith(CHAIRMAN_LABEL),
  );
  const chairman = paragraphs[chairmanIndex];
  const deputy = paragraphs[deputyIndex];
  const spacer = paragraphs[deputyIndex - 1];
  if (!chairman || !deputy || !spacer || chairmanIndex !== deputyIndex - 2 || textOf(spacer[0])) {
    throw templateError(
      `под таблицей ожидались строки «${CHAIRMAN_LABEL}» и «${DEPUTY_LABEL}» с пустой строкой между ними`,
    );
  }

  // в каждой строке два текста: подпись и ФИО после табуляций
  return (
    xml.slice(0, chairman.index) +
    setText(chairman[0], 1, form.chairman, CHAIRMAN_LABEL) +
    (form.deputy ? spacer[0] + setText(deputy[0], 1, form.deputy, DEPUTY_LABEL) : "") +
    xml.slice(deputy.index + deputy[0].length)
  );
}

export async function renderRegistryDocx(
  model: RegistryModel,
  form: RegistryForm,
): Promise<Buffer> {
  const zip = new PizZip(await fs.readFile(TEMPLATE_PATH, "binary"));
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw templateError("нет word/document.xml");
  const xml = docFile.asText();

  // Две таблицы: шапка со сведениями и список слушателей
  const tables = Array.from(xml.matchAll(TABLE_RE));
  const [info, students] = tables;
  if (!info || !students || tables.length !== 2) {
    throw templateError("ожидались две таблицы: шапка со сведениями и список слушателей");
  }
  const studentsEnd = students.index + students[0].length;

  zip.file(
    "word/document.xml",
    xml.slice(0, info.index) +
      fillInfoTable(info[0], {
        "Kurs/guruh:": model.groupCode,
        "Sana:": formatDate(form.date),
        "Vaqti:": form.time,
        "Joy:": form.place,
      }) +
      xml.slice(info.index + info[0].length, students.index) +
      fillStudentsTable(students[0], model.students) +
      fillSignatures(xml.slice(studentsEnd), form),
  );
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
