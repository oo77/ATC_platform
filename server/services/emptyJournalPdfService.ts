/**
 * PDF-версия «пустого журнала» — тот же бланк, что и Word (server/assets/templates/journal-template.docx):
 * титульный лист и страницы с таблицей посещаемости. Геометрия взята из шаблона:
 * A4, поля, ширины 16 колонок сетки, толщина линий, повёрнутые даты, шрифт Montserrat,
 * автонумерация слушателей (Times New Roman).
 *
 * Тексты бланка (заголовки, подписи полей) здесь заданы константами — при смене
 * шаблона их нужно поправить и здесь. Реализовано на pdf-lib (как и остальные PDF проекта).
 */

import fs from "fs/promises";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  chunk,
  groupCodeTail,
  JOURNAL_DATE_COLUMNS,
  type EmptyJournalModel,
} from "./emptyJournalService";

const tw = (twips: number) => twips / 20;
const BLACK = rgb(0, 0, 0);

// ============================================================================
// ГЕОМЕТРИЯ ШАБЛОНА (twips → pt)
// ============================================================================

const PAGE_W = tw(11906);
const PAGE_H = tw(16838);
const M_LEFT = tw(851);
const M_RIGHT = tw(566);
const M_TOP = tw(705);
const M_BOTTOM = tw(567);
const TEXT_W = PAGE_W - M_LEFT - M_RIGHT;
const PAGE_BOTTOM = PAGE_H - M_BOTTOM;

// Montserrat: hhea 968 / −251 на 1000 → одинарный интервал = 1.219 кегля
const ASCENT = 0.968;
const DESCENT = 0.251;
const SINGLE = ASCENT + DESCENT;

const BODY_SIZE = 12;
const BODY_LINE = 1.15 * SINGLE * BODY_SIZE; // межстрочный 1.15, как у основного текста шаблона
const CELL_LINE = SINGLE * BODY_SIZE; // одинарный интервал внутри таблицы
const CELL_PAD_X = tw(108); // поля ячейки слева/справа

/** Стоп-табуляции: один заданный (1276 tw), дальше — стандартные через 708 tw */
const CUSTOM_TAB = tw(1276);
const DEFAULT_TAB = tw(708);

/** Сетка таблицы: № | ФИО | «Sana» | 13 колонок дат | служебная колонка 35 tw */
const GRID_TW = [
  555, 3423, 690, 425, 460, 419, 419, 419, 457, 457, 457, 456, 425, 567, 426, 425, 35,
];
const COL_NUM = 0;
const COL_NAME = 1;
const COL_SANA = 2;
const COL_DATE0 = 3;
const COL_TAIL = GRID_TW.length - 1;
const GRID_W = tw(GRID_TW.reduce((a, b) => a + b, 0));
const X0 = M_LEFT + (TEXT_W - GRID_W) / 2; // таблица выровнена по центру
const GX: number[] = [X0];
GRID_TW.forEach((w, i) => GX.push(GX[i]! + tw(w)));

const ROW_CAPTION_H = tw(601);
const ROW_DATES_H = tw(978);
const STUDENT_PAD = tw(60); // отступы до/после текста в ячейке ФИО
const BORDER_THICK = 1; // sz=8
const BORDER_THIN = 0.5; // sz=4

// ============================================================================
// ШРИФТЫ И ПРИМИТИВЫ
// ============================================================================

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  times: PDFFont;
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  fonts: Fonts;
  /** Текущая позиция сверху страницы, pt */
  y: number;
  /** Даты текущей страницы журнала — чтобы повторить шапку при переносе таблицы */
  currentDates: string[];
}

const clean = (s: string) => s.replace(/[\x00-\x1F\x7F]/g, " ");
const py = (topDownY: number) => PAGE_H - topDownY;

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = M_TOP;
}

function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  baseline: number,
  font: PDFFont,
  size: number,
  rotate = 0,
) {
  if (!text) return;
  ctx.page.drawText(clean(text), {
    x,
    y: py(baseline),
    size,
    font,
    color: BLACK,
    ...(rotate ? { rotate: degrees(rotate) } : {}),
  });
}

function hLine(ctx: Ctx, x1: number, x2: number, y: number, thickness: number) {
  ctx.page.drawLine({
    start: { x: x1, y: py(y) },
    end: { x: x2, y: py(y) },
    thickness,
    color: BLACK,
  });
}

function vLine(ctx: Ctx, x: number, y1: number, y2: number, thickness: number) {
  ctx.page.drawLine({
    start: { x, y: py(y1) },
    end: { x, y: py(y2) },
    thickness,
    color: BLACK,
  });
}

function underline(ctx: Ctx, x1: number, x2: number, baseline: number, size: number) {
  hLine(ctx, x1, x2, baseline + size * 0.1, size * 0.05);
}

/** Перенос по словам; слово длиннее строки режется по символам */
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
    if (!current || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

// ============================================================================
// ТИТУЛЬНЫЙ ЛИСТ
// ============================================================================

function drawCover(ctx: Ctx, year: string) {
  const { regular, bold } = ctx.fonts;
  const empty = (size: number, count: number) =>
    Array.from({ length: count }, () => ({ size }));

  const lines: Array<{ text?: string; size: number; bold?: boolean; after?: number }> = [
    { text: "“UZBEKISTAN AIRPORTS” AKSIYADORLIK JAMIYATI", size: 14, after: 10 },
    { text: "“AIRPORTS TRAINING CENTER”", size: 14 },
    { text: "MAS’ULIYATI CHEKLANGAN JAMIYAT", size: 14 },
    ...empty(20, 9),
    { text: "GURUH", size: 48, bold: true },
    { text: "J U R N A L I", size: 48, bold: true },
    ...empty(48, 6),
    { text: `Toshkent-${year}`, size: 16 },
  ];

  let y = M_TOP;
  for (const line of lines) {
    if (line.text) {
      const font = line.bold ? bold : regular;
      const width = font.widthOfTextAtSize(line.text, line.size);
      drawText(
        ctx,
        line.text,
        M_LEFT + (TEXT_W - width) / 2,
        y + ASCENT * line.size,
        font,
        line.size,
      );
    }
    y += line.size * SINGLE + (line.after ?? 0);
  }
}

// ============================================================================
// ШАПКА СТРАНИЦЫ: «Guruh … Kurs sanasi …», «Kurs nomi …»
// ============================================================================

interface Piece {
  text?: string;
  tab?: true;
  bold?: boolean;
  underline?: boolean;
}

function nextTabStop(x: number): number {
  if (x < CUSTOM_TAB - 0.01) return CUSTOM_TAB;
  return (Math.floor((x + 0.01) / DEFAULT_TAB) + 1) * DEFAULT_TAB;
}

/** Рисует строку из фрагментов с табуляциями; возвращает конечный x (от левого поля) */
function drawPieces(
  ctx: Ctx,
  pieces: Piece[],
  startX: number,
  baseline: number,
  size = BODY_SIZE,
): number {
  let x = startX;
  for (const piece of pieces) {
    if (piece.tab) {
      x = nextTabStop(x);
      continue;
    }
    const font = piece.bold ? ctx.fonts.bold : ctx.fonts.regular;
    const text = piece.text ?? "";
    const width = font.widthOfTextAtSize(clean(text), size);
    drawText(ctx, text, M_LEFT + x, baseline, font, size);
    if (piece.underline && text.trim()) {
      underline(ctx, M_LEFT + x, M_LEFT + x + width, baseline, size);
    }
    x += width;
  }
  return x;
}

function measurePieces(ctx: Ctx, pieces: Piece[], startX: number, size = BODY_SIZE): number {
  let x = startX;
  for (const piece of pieces) {
    if (piece.tab) {
      x = nextTabStop(x);
      continue;
    }
    const font = piece.bold ? ctx.fonts.bold : ctx.fonts.regular;
    x += font.widthOfTextAtSize(clean(piece.text ?? ""), size);
  }
  return x;
}

function ensureSpace(ctx: Ctx, height: number) {
  if (ctx.y + height > PAGE_BOTTOM) newPage(ctx);
}

function drawGroupLine(ctx: Ctx, model: EmptyJournalModel) {
  const left: Piece[] = [
    { text: "Guruh: " },
    { text: "______", bold: true },
    { text: model.groupCode, bold: true, underline: true },
    { text: groupCodeTail(model.groupCode), bold: true },
    { tab: true },
    { tab: true },
  ];
  const right: Piece[] = [
    { text: "Kurs sanasi:" },
    { text: " ", bold: true },
    { text: "____", bold: true },
    { text: model.courseDates, bold: true, underline: true },
    { text: "_____", bold: true },
  ];

  const baselineOffset = BODY_LINE - DESCENT * BODY_SIZE;
  ensureSpace(ctx, BODY_LINE);
  const afterLeft = measurePieces(ctx, left, 0);
  const fitsOneLine = measurePieces(ctx, [...left, ...right], 0) <= TEXT_W;

  drawPieces(ctx, left, 0, ctx.y + baselineOffset);
  if (fitsOneLine) {
    drawPieces(ctx, right, afterLeft, ctx.y + baselineOffset);
  } else {
    // Длинный код группы: «Kurs sanasi» уходит на следующую строку
    ctx.y += BODY_LINE;
    ensureSpace(ctx, BODY_LINE);
    drawPieces(ctx, right, 0, ctx.y + baselineOffset);
  }
  ctx.y += BODY_LINE + tw(200); // интервал после абзаца по умолчанию — 10 pt
}

interface JustWord {
  text: string;
  underline: boolean;
}

/** «Kurs nomi: …» — абзац по ширине, название курса подчёркнуто */
function drawCourseName(ctx: Ctx, courseName: string) {
  const font = ctx.fonts.regular;
  const words: JustWord[] = [
    { text: "Kurs", underline: false },
    { text: "nomi:", underline: false },
    ...(courseName
      ? clean(courseName)
          .split(/\s+/)
          .filter(Boolean)
          .map((text) => ({ text, underline: true }))
      : [{ text: "________________", underline: false }]),
  ];

  const space = font.widthOfTextAtSize(" ", BODY_SIZE);
  const widthOf = (w: JustWord) => font.widthOfTextAtSize(w.text, BODY_SIZE);

  const lines: JustWord[][] = [];
  let current: JustWord[] = [];
  let currentWidth = 0;
  for (const word of words) {
    const ww = widthOf(word);
    if (current.length > 0 && currentWidth + space + ww > TEXT_W) {
      lines.push(current);
      current = [];
      currentWidth = 0;
    }
    currentWidth += (current.length > 0 ? space : 0) + ww;
    current.push(word);
  }
  if (current.length > 0) lines.push(current);

  lines.forEach((line, lineIndex) => {
    ensureSpace(ctx, BODY_LINE);
    const natural = line.reduce((sum, w) => sum + widthOf(w), 0) + space * (line.length - 1);
    const isLast = lineIndex === lines.length - 1;
    const gap =
      !isLast && line.length > 1 ? space + (TEXT_W - natural) / (line.length - 1) : space;

    const baseline = ctx.y + BODY_LINE - DESCENT * BODY_SIZE;
    let x = M_LEFT;
    let ulFrom: number | null = null;
    let ulTo = 0;
    line.forEach((word, i) => {
      drawText(ctx, word.text, x, baseline, font, BODY_SIZE);
      const end = x + widthOf(word);
      if (word.underline) {
        if (ulFrom === null) ulFrom = x;
        ulTo = end;
      } else if (ulFrom !== null) {
        underline(ctx, ulFrom, ulTo, baseline, BODY_SIZE);
        ulFrom = null;
      }
      x = end + (i < line.length - 1 ? gap : 0);
    });
    if (ulFrom !== null) underline(ctx, ulFrom, ulTo, baseline, BODY_SIZE);
    ctx.y += BODY_LINE;
  });
}

// ============================================================================
// ТАБЛИЦА
// ============================================================================

/** Центр ячейки/диапазона колонок по горизонтали */
const centerX = (fromCol: number, toCol: number) => (GX[fromCol]! + GX[toCol + 1]!) / 2;

function drawCenteredLines(
  ctx: Ctx,
  lines: string[],
  font: PDFFont,
  size: number,
  cx: number,
  top: number,
) {
  lines.forEach((line, i) => {
    const width = font.widthOfTextAtSize(clean(line), size);
    drawText(ctx, line, cx - width / 2, top + i * CELL_LINE + ASCENT * size, font, size);
  });
}

/** Две строки шапки: «№ / ФИО», «Sana» и даты. Возвращает высоту шапки */
function drawTableHead(ctx: Ctx, pageDates: string[]): number {
  const { bold } = ctx.fonts;
  const top = ctx.y;
  const mid = top + ROW_CAPTION_H;
  const bottom = mid + ROW_DATES_H;
  const lastDateCol = COL_TAIL - 1;

  // Объединённые ячейки «№» и «Tinglovchining ismi, sharifi» (две строки шапки)
  const mergedCenterY = (top + bottom) / 2;
  drawText(
    ctx,
    "№",
    centerX(COL_NUM, COL_NUM) - bold.widthOfTextAtSize("№", BODY_SIZE) / 2,
    mergedCenterY - CELL_LINE / 2 + ASCENT * BODY_SIZE,
    bold,
    BODY_SIZE,
  );
  const nameLines = wrapText(
    "Tinglovchining ismi, sharifi",
    bold,
    BODY_SIZE,
    tw(GRID_TW[COL_NAME]!) - 2 * CELL_PAD_X,
  );
  drawCenteredLines(
    ctx,
    nameLines,
    bold,
    BODY_SIZE,
    centerX(COL_NAME, COL_NAME),
    mergedCenterY - (nameLines.length * CELL_LINE) / 2,
  );

  // «Kursga qatnashish, …» — над колонками дат (в шаблоне ячейка тянется до служебной колонки)
  const captionCx = (GX[COL_DATE0]! + GX[COL_TAIL + 1]!) / 2;
  const captionLines = wrapText(
    "Kursga qatnashish, rejaviy topshiriqlar, ularning bajarilishi",
    bold,
    BODY_SIZE,
    GX[COL_TAIL + 1]! - GX[COL_DATE0]! - 2 * CELL_PAD_X,
  );
  drawCenteredLines(ctx, captionLines, bold, BODY_SIZE, captionCx, top);

  // «Sana» — вертикально, снизу вверх, по центру колонки
  const sanaBaselineX = centerX(COL_SANA, COL_SANA) - CELL_LINE / 2 + ASCENT * BODY_SIZE;
  drawText(ctx, "Sana", sanaBaselineX, bottom - tw(113), bold, BODY_SIZE, 90);

  // Даты — вертикально, по центру высоты строки, у левого края ячейки
  pageDates.slice(0, JOURNAL_DATE_COLUMNS).forEach((date, i) => {
    const col = COL_DATE0 + i;
    const size = 11;
    const width = bold.widthOfTextAtSize(date, size);
    drawText(
      ctx,
      date,
      GX[col]! + ASCENT * size,
      (mid + bottom) / 2 + width / 2,
      bold,
      size,
      90,
    );
  });

  // --- линии шапки ---
  // горизонтали: верх (1 pt), под подписью «Kursga…» (1 pt), низ строки дат (0,5 pt)
  hLine(ctx, GX[0]!, GX[COL_TAIL + 1]!, top, BORDER_THICK);
  hLine(ctx, GX[COL_SANA]!, GX[COL_TAIL + 1]!, mid, BORDER_THICK);
  hLine(ctx, GX[0]!, GX[lastDateCol + 1]!, bottom, BORDER_THIN);
  // вертикали
  vLine(ctx, GX[0]!, top, bottom, BORDER_THICK);
  vLine(ctx, GX[COL_SANA]!, top, bottom, BORDER_THICK);
  vLine(ctx, GX[COL_DATE0]!, mid, bottom, BORDER_THICK);
  for (let col = COL_DATE0; col <= lastDateCol; col++) {
    vLine(ctx, GX[col + 1]!, mid, bottom, BORDER_THICK);
  }
  vLine(ctx, GX[COL_TAIL + 1]!, top, mid, BORDER_THICK);

  ctx.y = bottom;
  return bottom - top;
}

function drawStudentRow(ctx: Ctx, index: number, name: string) {
  const { regular, times } = ctx.fonts;
  const nameWidth = tw(GRID_TW[COL_NAME]! + GRID_TW[COL_SANA]!) - 2 * CELL_PAD_X;
  const lines = wrapText(name, regular, BODY_SIZE, nameWidth);
  const height = Math.max(lines.length * CELL_LINE + 2 * STUDENT_PAD, CELL_LINE) + BORDER_THIN;

  if (ctx.y + height > PAGE_BOTTOM) {
    newPage(ctx);
    drawTableHead(ctx, ctx.currentDates);
  }

  const top = ctx.y;
  const bottom = top + height;

  // № — автонумерация «1.», «2.», … шрифтом Times New Roman, вертикально по центру
  const label = `${index}.`;
  const tnrLine = 1.149 * BODY_SIZE;
  drawText(
    ctx,
    label,
    GX[COL_NUM]! + CELL_PAD_X + tw(33),
    (top + bottom) / 2 - tnrLine / 2 + 0.891 * BODY_SIZE,
    times,
    BODY_SIZE,
  );

  lines.forEach((line, i) => {
    drawText(
      ctx,
      line,
      GX[COL_NAME]! + CELL_PAD_X,
      top + STUDENT_PAD + i * CELL_LINE + ASCENT * BODY_SIZE,
      regular,
      BODY_SIZE,
    );
  });

  // сетка строки: №, ФИО (объединяет колонку «Sana»), 13 ячеек дат — все линии 0,5 pt
  const lastDateCol = COL_TAIL - 1;
  hLine(ctx, GX[0]!, GX[lastDateCol + 1]!, bottom, BORDER_THIN);
  const verticals = [COL_NUM, COL_NAME, COL_DATE0];
  for (let col = COL_DATE0 + 1; col <= lastDateCol + 1; col++) verticals.push(col);
  for (const col of verticals) vLine(ctx, GX[col]!, top, bottom, BORDER_THIN);

  ctx.y = bottom;
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

function drawInstructorLine(ctx: Ctx, instructor: string) {
  const height = 2 * CELL_LINE; // межстрочный «двойной»
  const paragraphAfterTable = BODY_LINE; // пустой абзац между таблицей и подписью
  if (ctx.y + paragraphAfterTable + height > PAGE_BOTTOM) newPage(ctx);
  else ctx.y += paragraphAfterTable;

  const pieces: Piece[] = [
    { text: "Instruktor F.I.Sh: " },
    instructor
      ? { text: instructor, underline: true }
      : { text: "________________" },
    { tab: true },
    { tab: true },
    { tab: true },
    { text: "   ", bold: true },
    { tab: true },
    { tab: true },
    { text: "  ", bold: true },
    { text: "Imzo: " },
    { text: "________________" },
  ];
  drawPieces(ctx, pieces, tw(142), ctx.y + height - DESCENT * BODY_SIZE);
  ctx.y += height;
}

export async function renderEmptyJournalPdf(model: EmptyJournalModel): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Журнал группы ${model.groupCode}`);
  const fonts = await loadFonts(doc);

  const ctx: Ctx = {
    doc,
    page: doc.addPage([PAGE_W, PAGE_H]),
    fonts,
    y: M_TOP,
    currentDates: [],
  };

  drawCover(ctx, model.year);

  chunk(model.dates, JOURNAL_DATE_COLUMNS).forEach((pageDates) => {
    newPage(ctx);
    ctx.currentDates = pageDates;

    drawGroupLine(ctx, model);
    drawCourseName(ctx, model.courseName);
    ctx.y += BODY_LINE; // пустой абзац перед таблицей

    drawTableHead(ctx, pageDates);
    model.students.forEach((name, i) => drawStudentRow(ctx, i + 1, name));
    drawInstructorLine(ctx, model.instructor);
  });

  return Buffer.from(await doc.save());
}
