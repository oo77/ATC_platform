/**
 * Генерация "Ведомости проведения экзамена" (протокол аттестации) в PDF,
 * точно повторяющей утверждённый бланк — фирменный колонтитул с логотипом,
 * шрифт Montserrat, таблица результатов, блок подписей комиссии.
 *
 * Реализовано на pdf-lib (без Puppeteer/Chromium — тот же подход, что и для
 * сертификатов в server/utils/pdfGenerator.ts), т.к. это чистый JS без
 * внешних бинарников и уже используется в проекте.
 */

import fs from "fs";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { AttestationGroupWithDetails, AttestationCommissionEntry } from "../repositories/attestationGroupRepository";
import type { AttestationResultWithInstructor } from "../repositories/attestationResultRepository";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDateParts(date: Date | string | null | undefined) {
  if (!date) return { day: "___", month: "________", year: "20__" };
  const d = new Date(date);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTHS_RU[d.getMonth()],
    year: String(d.getFullYear()),
  };
}

function positionLabel(entry: { position: string | null; organization: string | null } | null) {
  if (!entry) return "";
  return [entry.position, entry.organization].filter(Boolean).join(", ");
}

// ============================================================================
// РАЗМЕТКА СТРАНИЦЫ (pt, A4)
// ============================================================================

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 42;
const MARGIN_RIGHT = 42;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const COLS = {
  num: 26,
  name: 215,
  score: 88,
  decision: 88,
  sign: 0, // вычисляется как остаток
};
COLS.sign = CONTENT_WIDTH - COLS.num - COLS.name - COLS.score - COLS.decision;

const BLACK = rgb(0, 0, 0);

interface Ctx {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN_TOP;
}

function ensureSpace(ctx: Ctx, height: number) {
  if (ctx.y - height < MARGIN_BOTTOM) {
    newPage(ctx);
  }
}

function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  size: number,
  font: PDFFont,
  opts: { align?: "left" | "center" | "right"; width?: number } = {}
) {
  let drawX = x;
  if (opts.align === "center" && opts.width) {
    drawX = x + (opts.width - font.widthOfTextAtSize(text, size)) / 2;
  } else if (opts.align === "right" && opts.width) {
    drawX = x + opts.width - font.widthOfTextAtSize(text, size);
  }
  ctx.page.drawText(text, { x: drawX, y: ctx.y, size, font, color: BLACK });
}

/** Рисует один или несколько wrapped-строк начиная с текущего y, сдвигая курсор вниз */
function drawParagraph(
  ctx: Ctx,
  text: string,
  opts: {
    x?: number;
    width?: number;
    size?: number;
    font?: PDFFont;
    lineHeight?: number;
    align?: "left" | "center" | "right";
    spacingAfter?: number;
  } = {}
) {
  const x = opts.x ?? MARGIN_LEFT;
  const width = opts.width ?? CONTENT_WIDTH;
  const size = opts.size ?? 10;
  const font = opts.font ?? ctx.regular;
  const lineHeight = opts.lineHeight ?? size * 1.35;

  const lines = wrapText(font, text, size, width);
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    drawText(ctx, line, x, size, font, { align: opts.align, width });
    ctx.y -= lineHeight;
  }
  ctx.y -= opts.spacingAfter ?? 0;
}

/** Рисует "жирный лейбл: значение" одной параграфной единицей с переносом */
function drawLabeledLine(ctx: Ctx, label: string, value: string, size = 10) {
  const lineHeight = size * 1.4;
  const words = value.split(/\s+/).filter(Boolean);
  let line = `${label} `;
  let firstLineDrawn = false;
  const maxWidth = CONTENT_WIDTH;

  const flush = (text: string, isFirst: boolean) => {
    ensureSpace(ctx, lineHeight);
    if (isFirst) {
      ctx.page.drawText(label + " ", { x: MARGIN_LEFT, y: ctx.y, size, font: ctx.bold, color: BLACK });
      const labelWidth = ctx.bold.widthOfTextAtSize(label + " ", size);
      ctx.page.drawText(text, { x: MARGIN_LEFT + labelWidth, y: ctx.y, size, font: ctx.regular, color: BLACK });
    } else {
      ctx.page.drawText(text, { x: MARGIN_LEFT, y: ctx.y, size, font: ctx.regular, color: BLACK });
    }
    ctx.y -= lineHeight;
  };

  // Собираем строки с учётом ширины (первая строка короче из-за лейбла)
  const labelWidth = ctx.bold.widthOfTextAtSize(label + " ", size);
  let current = "";
  let isFirst = true;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const availWidth = isFirst ? maxWidth - labelWidth : maxWidth;
    if (ctx.regular.widthOfTextAtSize(candidate, size) <= availWidth || !current) {
      current = candidate;
    } else {
      flush(current, isFirst);
      isFirst = false;
      current = word;
    }
  }
  flush(current, isFirst);
}

// ============================================================================
// ТАБЛИЦА
// ============================================================================

function drawTableHeader(ctx: Ctx) {
  const headerHeight = 36;
  ensureSpace(ctx, headerHeight);
  const top = ctx.y;
  const bottom = top - headerHeight;

  let x = MARGIN_LEFT;
  const cells: Array<{ label: string; width: number }> = [
    { label: "№\nп/п", width: COLS.num },
    { label: "Ф.И.О. слушателя", width: COLS.name },
    { label: "Итоговый экзамен\n(балл/оценка)", width: COLS.score },
    { label: "Решение\n(успешно/\nне успешно)", width: COLS.decision },
    { label: "Подпись\nответственного", width: COLS.sign },
  ];

  for (const cell of cells) {
    ctx.page.drawRectangle({ x, y: bottom, width: cell.width, height: headerHeight, borderColor: BLACK, borderWidth: 0.75 });
    const parts = cell.label.split("\n");
    const size = 7.5;
    const lh = size * 1.35;
    const blockHeight = parts.length * lh;
    let ty = top - (headerHeight - blockHeight) / 2 - size;
    for (const part of parts) {
      const tw = ctx.bold.widthOfTextAtSize(part, size);
      ctx.page.drawText(part, { x: x + (cell.width - tw) / 2, y: ty, size, font: ctx.bold, color: BLACK });
      ty -= lh;
    }
    x += cell.width;
  }

  ctx.y = bottom;
}

function drawTableRow(
  ctx: Ctx,
  index: number,
  fullName: string,
  score: string,
  decisionText: string
) {
  const size = 9;
  const lineHeight = size * 1.3;
  const nameLines = wrapText(ctx.regular, fullName, size, COLS.name - 8);
  const rowHeight = Math.max(20, nameLines.length * lineHeight + 8);

  if (ctx.y - rowHeight < MARGIN_BOTTOM) {
    newPage(ctx);
    drawTableHeader(ctx);
  }

  const top = ctx.y;
  const bottom = top - rowHeight;
  let x = MARGIN_LEFT;

  const cellWidths = [COLS.num, COLS.name, COLS.score, COLS.decision, COLS.sign];
  for (const w of cellWidths) {
    ctx.page.drawRectangle({ x, y: bottom, width: w, height: rowHeight, borderColor: BLACK, borderWidth: 0.75 });
    x += w;
  }

  // № п/п
  const numText = `${index}.`;
  ctx.page.drawText(numText, {
    x: MARGIN_LEFT + (COLS.num - ctx.regular.widthOfTextAtSize(numText, size)) / 2,
    y: top - rowHeight / 2 - size / 2.5,
    size, font: ctx.regular, color: BLACK,
  });

  // ФИО (может занимать несколько строк)
  let nameY = top - lineHeight;
  const nameX = MARGIN_LEFT + COLS.num + 5;
  for (const line of nameLines) {
    ctx.page.drawText(line, { x: nameX, y: nameY, size, font: ctx.regular, color: BLACK });
    nameY -= lineHeight;
  }

  // Балл
  const scoreX = MARGIN_LEFT + COLS.num + COLS.name;
  if (score) {
    ctx.page.drawText(score, {
      x: scoreX + (COLS.score - ctx.regular.widthOfTextAtSize(score, size)) / 2,
      y: top - rowHeight / 2 - size / 2.5,
      size, font: ctx.regular, color: BLACK,
    });
  }

  // Решение
  const decisionX = scoreX + COLS.score;
  if (decisionText) {
    ctx.page.drawText(decisionText, {
      x: decisionX + (COLS.decision - ctx.regular.widthOfTextAtSize(decisionText, size)) / 2,
      y: top - rowHeight / 2 - size / 2.5,
      size, font: ctx.regular, color: BLACK,
    });
  }

  ctx.y = bottom;
}

// ============================================================================
// БЛОК ПОДПИСИ
// ============================================================================

function drawSignatureRow(
  ctx: Ctx,
  positionText: string,
  name: string,
  withSeal: boolean
) {
  const size = 10;
  const lineHeight = size * 1.35;
  const positionWidth = 320;
  const lineWidth = 95;
  const nameWidth = CONTENT_WIDTH - positionWidth - lineWidth - 16;
  const nameX = MARGIN_LEFT + positionWidth + lineWidth + 16;
  const lineX = MARGIN_LEFT + positionWidth + 8;

  const posLines = wrapText(ctx.regular, positionText, size, positionWidth);
  const blockHeight = Math.max(posLines.length * lineHeight, lineHeight) + (withSeal ? 12 : 0) + 10;

  ensureSpace(ctx, blockHeight);
  const top = ctx.y;

  let py = top;
  for (const line of posLines) {
    ctx.page.drawText(line, { x: MARGIN_LEFT, y: py - size, size, font: ctx.regular, color: BLACK });
    py -= lineHeight;
  }

  // Линия подписи — на уровне последней строки позиции
  const sigLineY = top - Math.max(posLines.length, 1) * lineHeight + lineHeight - 4;
  ctx.page.drawLine({
    start: { x: lineX, y: sigLineY },
    end: { x: lineX + lineWidth, y: sigLineY },
    thickness: 0.75,
    color: BLACK,
  });

  if (withSeal) {
    const mpText = "М.П.";
    const mpSize = 8;
    ctx.page.drawText(mpText, {
      x: lineX + (lineWidth - ctx.regular.widthOfTextAtSize(mpText, mpSize)) / 2,
      y: sigLineY - 11,
      size: mpSize, font: ctx.regular, color: BLACK,
    });
  }

  if (name) {
    ctx.page.drawText(name, {
      x: nameX + (nameWidth - ctx.bold.widthOfTextAtSize(name, size)) / 2,
      y: sigLineY + 4,
      size, font: ctx.bold, color: BLACK,
    });
  }

  ctx.y = top - blockHeight;
}

// ============================================================================
// ГЛАВНАЯ ФУНКЦИЯ
// ============================================================================

export interface ProtocolPdfData {
  group: AttestationGroupWithDetails;
  commission: AttestationCommissionEntry[];
  results: AttestationResultWithInstructor[];
}

export async function generateProtocolPdfBuffer(data: ProtocolPdfData): Promise<Buffer> {
  const { group, commission, results } = data;

  const chairman = commission.find((c) => c.role === "chairman") || null;
  const responsible = commission.find((c) => c.role === "responsible") || null;
  const secretary = commission.find((c) => c.role === "secretary") || null;
  const members = commission.filter((c) => c.role === "member");

  const exam = formatDateParts(group.examStart);

  const decided = results.filter((r) => r.decision === "passed" || r.decision === "failed");
  const total = decided.length;
  const passedCount = decided.filter((r) => r.decision === "passed").length;
  const failedCount = total - passedCount;
  const passedPercent = total > 0 ? Math.round((passedCount / total) * 100) : 0;
  const failedPercent = total > 0 ? 100 - passedPercent : 0;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontsDir = path.join(process.cwd(), "server", "assets", "fonts");
  let regular: PDFFont;
  let bold: PDFFont;
  try {
    const regularBytes = fs.readFileSync(path.join(fontsDir, "Montserrat-400.ttf"));
    const boldBytes = fs.readFileSync(path.join(fontsDir, "Montserrat-700.ttf"));
    regular = await pdfDoc.embedFont(regularBytes, { subset: true });
    bold = await pdfDoc.embedFont(boldBytes, { subset: true });
  } catch {
    regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const ctx: Ctx = { pdfDoc, page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: 0, regular, bold };
  ctx.y = PAGE_HEIGHT - MARGIN_TOP;

  // --- Header ---
  const logoPath = path.join(process.cwd(), "public", "android-chrome-192x192.png");
  const logoSize = 46;
  let logoImage;
  try {
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch {
    logoImage = null;
  }

  const headerTop = ctx.y;
  const colWidth = 190;
  const headerText = (x: number) => {
    const line1 = "«AIRPORTS TRAINING";
    const line2 = "CENTER»";
    const size1 = 9.5;
    ctx.page.drawText(line1, { x: x + (colWidth - bold.widthOfTextAtSize(line1, size1)) / 2, y: headerTop - 10, size: size1, font: bold, color: BLACK });
    ctx.page.drawText(line2, { x: x + (colWidth - bold.widthOfTextAtSize(line2, size1)) / 2, y: headerTop - 24, size: size1, font: bold, color: BLACK });
  };
  headerText(MARGIN_LEFT);
  headerText(PAGE_WIDTH - MARGIN_RIGHT - colWidth);

  const sub1 = "Mas'uliyati cheklangan jamiyati";
  const sub2 = "Limited Liability Company";
  const subSize = 8.5;
  ctx.page.drawText(sub1, {
    x: MARGIN_LEFT + (colWidth - regular.widthOfTextAtSize(sub1, subSize)) / 2,
    y: headerTop - 42, size: subSize, font: regular, color: BLACK,
  });
  ctx.page.drawText(sub2, {
    x: PAGE_WIDTH - MARGIN_RIGHT - colWidth + (colWidth - regular.widthOfTextAtSize(sub2, subSize)) / 2,
    y: headerTop - 42, size: subSize, font: regular, color: BLACK,
  });

  if (logoImage) {
    ctx.page.drawImage(logoImage, {
      x: (PAGE_WIDTH - logoSize) / 2,
      y: headerTop - logoSize + 6,
      width: logoSize,
      height: logoSize,
    });
  }

  ctx.y = headerTop - 56;
  // Двойная линия
  ctx.page.drawLine({ start: { x: MARGIN_LEFT, y: ctx.y }, end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: ctx.y }, thickness: 1.5, color: BLACK });
  ctx.page.drawLine({ start: { x: MARGIN_LEFT, y: ctx.y - 2.5 }, end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: ctx.y - 2.5 }, thickness: 1.5, color: BLACK });
  ctx.y -= 26;

  // --- Title ---
  const title = "ВЕДОМОСТЬ ПРОВЕДЕНИЯ ЭКЗАМЕНА";
  const titleSize = 13;
  drawText(ctx, title, MARGIN_LEFT, titleSize, bold, { align: "center", width: CONTENT_WIDTH });
  ctx.y -= titleSize * 1.6;

  // --- Info block ---
  drawLabeledLine(ctx, "Наименование (курса / дисциплины):", group.name);
  drawLabeledLine(ctx, "Вид контроля:", "тест");
  drawLabeledLine(ctx, "Дата проведения:", `«${exam.day}» ${exam.month} ${exam.year} г.`);
  drawLabeledLine(ctx, "Место проведения:", group.location || "");
  drawLabeledLine(
    ctx,
    "Ф.И.О. ответственного:",
    responsible ? [responsible.fullName, responsible.position].filter(Boolean).join(", ") : ""
  );
  drawLabeledLine(
    ctx,
    "Секретарь:",
    secretary ? [secretary.fullName, secretary.position].filter(Boolean).join(", ") : ""
  );
  ctx.y -= 8;

  // --- Results title + table ---
  drawText(ctx, "Результаты экзамена:", MARGIN_LEFT, 10.5, bold, { align: "center", width: CONTENT_WIDTH });
  ctx.y -= 18;

  drawTableHeader(ctx);
  results.forEach((r, i) => {
    const score = r.scorePercent !== null ? Math.round(r.scorePercent).toString() : "";
    const decisionText = r.decision === "passed" ? "успешно" : r.decision === "failed" ? "не успешно" : "";
    drawTableRow(ctx, i + 1, r.fullName, score, decisionText);
  });

  ctx.y -= 16;

  // --- Summary ---
  drawParagraph(
    ctx,
    `Итого: тестовые испытания прошли ${total} человек, успешно сдавшие сертификационный экзамен ${passedCount} (${passedPercent} %), не сдавшие сертификационный экзамен ${failedCount} (${failedPercent} %).`,
    { spacingAfter: 10 }
  );

  drawParagraph(
    ctx,
    "Решение комиссии: рекомендовать выдать сертификаты инструктора-преподавателя по авиационной безопасности успешно сдавшим сертификационный экзамен. Не сдавшим сертификационный экзамен — включить в списки для очередного прохождения сертификационных экзаменов.",
    { spacingAfter: 16 }
  );

  // --- Signatures ---
  drawParagraph(ctx, "Подписи членов комиссии:", { font: bold, spacingAfter: 8 });

  drawSignatureRow(
    ctx,
    ["Председатель комиссии,", positionLabel(chairman)].filter(Boolean).join("\n"),
    chairman?.fullName || "",
    true
  );

  ctx.y -= 4;
  drawParagraph(ctx, "Члены комиссии:", { font: bold, spacingAfter: 6 });
  for (const m of members) {
    drawSignatureRow(ctx, positionLabel(m), m.fullName, false);
  }

  ctx.y -= 4;
  drawParagraph(ctx, "Секретарь:", { font: bold, spacingAfter: 6 });
  drawSignatureRow(ctx, positionLabel(secretary), secretary?.fullName || "", false);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
