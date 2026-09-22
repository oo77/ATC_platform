/**
 * PDF-версия «Ведомости проведения контроля знаний» — тот же бланк, что и Word
 * (server/assets/templates/assessment-sheet-template.docx): геометрия (A4, поля, ширины
 * колонок, шрифт Montserrat) взята из шаблона. Ячейки баллов и «Итого, %» — пустые
 * (форма для заполнения от руки), как и в Word-версии; см. assessmentSheetService.ts.
 *
 * Реализовано на pdf-lib, как и остальные PDF проекта.
 */

import fs from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  disciplineColumnWidths,
  disciplineHeaderLines,
  wrapWithEllipsis,
  MAX_DISCIPLINES_PER_BLOCK,
  type AssessmentSheetModel,
} from "./assessmentSheetService";
import { chunk } from "./emptyJournalService";

const tw = (twips: number) => twips / 20;
const BLACK = rgb(0, 0, 0);

const PAGE_W = tw(11906);
const PAGE_H = tw(16838);
const M_LEFT = tw(425);
const M_RIGHT = tw(284);
const M_TOP = tw(1134);
const M_BOTTOM = tw(1134);
const TEXT_W = PAGE_W - M_LEFT - M_RIGHT;
const PAGE_BOTTOM = PAGE_H - M_BOTTOM;

// Montserrat: hhea 968 / −251 на 1000 → одинарный интервал = 1.219 кегля
const ASCENT = 0.968;
const DESCENT = 0.251;
const SINGLE = ASCENT + DESCENT;

const BODY_SIZE = 12; // sz=24 — большинство текста бланка
const BODY_LINE = SINGLE * BODY_SIZE; // межстрочный "одинарный" (line=240/auto в шаблоне)
const CELL_PAD_X = tw(108); // поля ячейки слева/справа (tblCellMar таблицы)

/** Сетка таблицы: № | ФИО | N колонок дисциплин | Итого — как в шаблоне */
const NUM_TW = 509;
const NAME_TW = 3318;
const ITOGO_TW = 2117;
const BORDER = 0.5; // sz=4 в шаблоне
/** Ячейка заголовка дисциплины/даты не выше этого числа строк — длинные названия обрезаются («…») */
const MAX_HEADER_LINES = 2;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  times: PDFFont;
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  fonts: Fonts;
  y: number;
  widths: number[]; // ширины колонок дисциплин, pt
  gx: number[]; // левые границы всех колонок + правая граница таблицы, pt
  disciplines: AssessmentSheetModel["disciplines"];
}

const clean = (s: string) => s.replace(/[\x00-\x1F\x7F]/g, " ");
const py = (topDownY: number) => PAGE_H - topDownY;

function drawText(ctx: Ctx, text: string, x: number, baseline: number, font: PDFFont, size: number, bold = false) {
  if (!text) return;
  ctx.page.drawText(clean(text), { x, y: py(baseline), size, font: bold ? ctx.fonts.bold : font, color: BLACK });
}

function hLine(ctx: Ctx, x1: number, x2: number, y: number, thickness = BORDER) {
  ctx.page.drawLine({ start: { x: x1, y: py(y) }, end: { x: x2, y: py(y) }, thickness, color: BLACK });
}

function vLine(ctx: Ctx, x: number, y1: number, y2: number, thickness = BORDER) {
  ctx.page.drawLine({ start: { x, y: py(y1) }, end: { x, y: py(y2) }, thickness, color: BLACK });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of clean(text).split(/\s+/).filter(Boolean)) {
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (current) lines.push(current);
      let part = "";
      for (const ch of Array.from(word)) {
        if (part && font.widthOfTextAtSize(part + ch, size) > maxWidth) {
          lines.push(part);
          part = "";
        }
        part += ch;
      }
      current = part;
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function drawCenteredLines(ctx: Ctx, lines: string[], font: PDFFont, size: number, cx: number, top: number, lineHeight = BODY_LINE) {
  lines.forEach((line, i) => {
    const width = font.widthOfTextAtSize(clean(line), size);
    drawText(ctx, line, cx - width / 2, top + i * lineHeight + ASCENT * size, font, size);
  });
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = M_TOP;
}

function ensureSpace(ctx: Ctx, height: number) {
  if (ctx.y + height > PAGE_BOTTOM) newPage(ctx);
}

// ============================================================================
// ШАПКА ДОКУМЕНТА
// ============================================================================

function drawHeader(ctx: Ctx, model: AssessmentSheetModel) {
  const { regular, bold } = ctx.fonts;
  const centerLine = (text: string, font: PDFFont) => {
    ensureSpace(ctx, BODY_LINE);
    const width = font.widthOfTextAtSize(clean(text), BODY_SIZE);
    drawText(ctx, text, M_LEFT + (TEXT_W - width) / 2, ctx.y + ASCENT * BODY_SIZE, font, BODY_SIZE);
    ctx.y += BODY_LINE;
  };

  centerLine("Ведомость проведения контроля знаний", bold);
  centerLine("слушателей курса", regular);
  for (const line of wrapText(model.courseName, regular, BODY_SIZE, TEXT_W)) centerLine(line, regular);
  centerLine(`группы ${model.groupCode}`, regular);
  ctx.y += BODY_LINE * 0.5; // пустая строка-разделитель перед таблицей (меньшим кеглем в шаблоне)
}

// ============================================================================
// ТАБЛИЦА
// ============================================================================

function computeGrid(disciplines: AssessmentSheetModel["disciplines"]): { widths: number[]; gx: number[] } {
  const widthsTw = disciplineColumnWidths(disciplines.length);
  const widths = widthsTw.map(tw);
  const colsTw = [NUM_TW, NAME_TW, ...widthsTw, ITOGO_TW];
  const gx: number[] = [M_LEFT];
  for (const w of colsTw) gx.push(gx[gx.length - 1]! + tw(w));
  return { widths, gx };
}

const COL_NUM = 0;
const COL_NAME = 1;
const COL_DISC0 = 2;

function drawTableHead(ctx: Ctx): number {
  const { bold } = ctx.fonts;
  const { gx, disciplines } = ctx;
  const lastCol = gx.length - 2; // индекс последней колонки (Итого)
  const top = ctx.y;

  // Длинные названия дисциплин (и, в крайнем случае, тесные даты) переносятся не больше чем
  // на MAX_HEADER_LINES строк и обрезаются с «…» — та же логика, что и в Word (см.
  // assessmentSheetService.wrapWithEllipsis), чтобы шапка не «расползалась» по высоте.
  const fitHeader = (text: string, widthPt: number) =>
    wrapWithEllipsis(text, (s) => bold.widthOfTextAtSize(clean(s), BODY_SIZE), widthPt - 2 * CELL_PAD_X, MAX_HEADER_LINES);

  // --- строка "Дисциплина: <имя> ... Итого, %" ---
  const disciplineLines = disciplines.map((d, i) =>
    disciplineHeaderLines(d, (s) => bold.widthOfTextAtSize(clean(s), BODY_SIZE), ctx.widths[i]! - 2 * CELL_PAD_X),
  );
  const row0Lines = Math.max(1, ...disciplineLines.map((l) => l.length));
  const row0H = row0Lines * BODY_LINE;

  drawCenteredLines(ctx, wrapText("Дисциплина:", bold, BODY_SIZE, tw(NUM_TW + NAME_TW) - 2 * CELL_PAD_X), bold, BODY_SIZE, (gx[COL_NUM]! + gx[COL_DISC0]!) / 2, top + (row0H - BODY_LINE) / 2);
  disciplines.forEach((_, i) => {
    drawCenteredLines(ctx, disciplineLines[i]!, bold, BODY_SIZE, (gx[COL_DISC0 + i]! + gx[COL_DISC0 + i + 1]!) / 2, top + (row0H - disciplineLines[i]!.length * BODY_LINE) / 2);
  });

  const row1Top = top + row0H;

  // --- строка "дата проведения: <дата> ..." ---
  const dateLines = disciplines.map((d, i) => fitHeader(d.date, ctx.widths[i]!));
  const row1H = Math.max(1, ...dateLines.map((l) => l.length)) * BODY_LINE;
  drawCenteredLines(ctx, ["дата проведения:"], bold, BODY_SIZE, (gx[COL_NUM]! + gx[COL_DISC0]!) / 2, row1Top + (row1H - BODY_LINE) / 2);
  disciplines.forEach((_, i) => {
    drawCenteredLines(ctx, dateLines[i]!, bold, BODY_SIZE, (gx[COL_DISC0 + i]! + gx[COL_DISC0 + i + 1]!) / 2, row1Top + (row1H - dateLines[i]!.length * BODY_LINE) / 2);
  });
  // "Итого, %" — объединённая ячейка на высоту обеих строк выше
  drawCenteredLines(ctx, ["Итого, %"], bold, BODY_SIZE, (gx[lastCol]! + gx[lastCol + 1]!) / 2, top + (row0H + row1H - BODY_LINE) / 2);

  const row2Top = row1Top + row1H;
  const row2H = BODY_LINE;
  drawCenteredLines(ctx, ["№"], bold, BODY_SIZE, (gx[COL_NUM]! + gx[COL_NUM + 1]!) / 2, row2Top);
  drawCenteredLines(ctx, wrapText("Ф.И.О. слушателя", bold, BODY_SIZE, tw(NAME_TW) - 2 * CELL_PAD_X), bold, BODY_SIZE, (gx[COL_NAME]! + gx[COL_NAME + 1]!) / 2, row2Top);
  drawCenteredLines(ctx, ["Балл, %"], bold, BODY_SIZE, (gx[COL_DISC0]! + gx[lastCol + 1]!) / 2, row2Top);

  const bottom = row2Top + row2H;

  // --- линии ---
  hLine(ctx, gx[0]!, gx[gx.length - 1]!, top);
  hLine(ctx, gx[0]!, gx[gx.length - 1]!, row1Top);
  hLine(ctx, gx[0]!, gx[lastCol + 1]!, row2Top);
  hLine(ctx, gx[0]!, gx[gx.length - 1]!, bottom);
  for (const x of gx) vLine(ctx, x, top, bottom);
  // между "Дисциплина:"/"дата проведения:" и колонками дисциплин уже покрыто gx-циклом

  ctx.y = bottom;
  return bottom - top;
}

function drawStudentRow(ctx: Ctx, index: number, name: string) {
  const { regular, times } = ctx.fonts;
  const { gx } = ctx;
  const lastCol = gx.length - 2;
  const nameLines = wrapText(name, regular, BODY_SIZE, tw(NAME_TW) - 2 * CELL_PAD_X);
  const height = Math.max(1, nameLines.length) * BODY_LINE;

  if (ctx.y + height > PAGE_BOTTOM) {
    newPage(ctx);
    drawTableHead(ctx);
  }
  const top = ctx.y;
  const bottom = top + height;

  const label = `${index}.`;
  drawText(ctx, label, gx[COL_NUM]! + (tw(NUM_TW) - times.widthOfTextAtSize(label, BODY_SIZE)) / 2, top + ASCENT * BODY_SIZE, times, BODY_SIZE);
  nameLines.forEach((line, i) => drawText(ctx, line, gx[COL_NAME]! + CELL_PAD_X, top + i * BODY_LINE + ASCENT * BODY_SIZE, regular, BODY_SIZE));

  hLine(ctx, gx[0]!, gx[lastCol + 1]!, bottom);
  for (const x of gx) vLine(ctx, x, top, bottom);

  ctx.y = bottom;
}

// ============================================================================
// БЛОК ПОДПИСЕЙ (как в шаблоне — фиксированные должности/ФИО)
// ============================================================================

const SIGN_BLOCK: Array<{ label: string; role: string; name: string }> = [
  { label: "Ответственный специалист (оператор):", role: "Специалист отдела ИКТ", name: "Исмаилов С.У." },
  { label: "Проверил:", role: "Специалист отдела по организации обучения", name: "Садиров И.Р." },
];

function drawSignatureBlock(ctx: Ctx) {
  const { regular, bold } = ctx.fonts;
  const nameColW = tw(3471);
  const signColW = tw(2257);
  const labelColW = TEXT_W - nameColW - signColW;
  const signX = M_LEFT + labelColW;
  const nameX = signX + signColW;

  ensureSpace(ctx, BODY_LINE * 5);
  ctx.y += BODY_LINE; // отступ от таблицы

  for (const row of SIGN_BLOCK) {
    ensureSpace(ctx, BODY_LINE * 2);
    drawText(ctx, row.label, M_LEFT, ctx.y + ASCENT * BODY_SIZE, bold, BODY_SIZE, true);
    ctx.y += BODY_LINE;
    drawText(ctx, row.role, M_LEFT, ctx.y + ASCENT * BODY_SIZE, bold, BODY_SIZE, true);
    const nameWidth = bold.widthOfTextAtSize(row.name, BODY_SIZE);
    hLine(ctx, nameX + (nameColW - nameWidth) / 2 - 4, nameX + (nameColW + nameWidth) / 2 + 4, ctx.y + BODY_LINE * 0.82);
    drawText(ctx, row.name, nameX + (nameColW - nameWidth) / 2, ctx.y + ASCENT * BODY_SIZE, bold, BODY_SIZE, true);
    ctx.y += BODY_LINE;

    const signCaption = "(подпись)";
    const nameCaption = "(Ф.И.О.)";
    const capSize = BODY_SIZE * 0.7;
    drawText(ctx, signCaption, signX + (signColW - regular.widthOfTextAtSize(signCaption, capSize)) / 2, ctx.y + ASCENT * capSize, regular, capSize);
    drawText(ctx, nameCaption, nameX + (nameColW - regular.widthOfTextAtSize(nameCaption, capSize)) / 2, ctx.y + ASCENT * capSize, regular, capSize);
    ctx.y += BODY_LINE * 1.6;
  }
}

// ============================================================================
// СБОРКА ДОКУМЕНТА
// ============================================================================

async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  const fontsDir = path.join(process.cwd(), "server", "assets", "fonts");
  const [regularBytes, boldBytes] = await Promise.all([
    fs.readFile(path.join(fontsDir, "Montserrat-400.ttf")),
    fs.readFile(path.join(fontsDir, "Montserrat-700.ttf")),
  ]);
  return {
    regular: await doc.embedFont(regularBytes, { subset: true }),
    bold: await doc.embedFont(boldBytes, { subset: true }),
    times: await doc.embedFont(StandardFonts.TimesRoman),
  };
}

export async function renderAssessmentSheetPdf(model: AssessmentSheetModel): Promise<Buffer> {
  if (model.disciplines.length === 0) {
    throw new Error(
      "У группы нет запланированных контролей знаний (событий типа «assessment» в расписании) — печатать нечего",
    );
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`Ведомость контроля знаний ${model.groupCode}`);
  const fonts = await loadFonts(doc);

  const ctx: Ctx = {
    doc,
    page: doc.addPage([PAGE_W, PAGE_H]),
    fonts,
    y: M_TOP,
    widths: [],
    gx: [],
    disciplines: [],
  };

  // Больше MAX_DISCIPLINES_PER_BLOCK дисциплин — отдельная страница-бланк на каждую пачку
  // колонок (см. assessmentSheetService.MAX_DISCIPLINES_PER_BLOCK), с той же логикой, что и в Word.
  chunk(model.disciplines, MAX_DISCIPLINES_PER_BLOCK).forEach((disciplines, i) => {
    if (i > 0) newPage(ctx);
    const { widths, gx } = computeGrid(disciplines);
    ctx.widths = widths;
    ctx.gx = gx;
    ctx.disciplines = disciplines;

    drawHeader(ctx, model);
    drawTableHead(ctx);
    model.students.forEach((name, si) => drawStudentRow(ctx, si + 1, name));
    drawSignatureBlock(ctx);
  });

  return Buffer.from(await doc.save());
}
