/**
 * Генератор PDF для сертификатов
 *
 * Использует pdf-lib (чистый JS) вместо Puppeteer/Chromium.
 * Поддерживает: текст, переменные, изображения, QR-коды, фигуры, фоны.
 *
 * Система координат:
 *  - HTML/шаблон: (0,0) — верхний левый угол
 *  - pdf-lib:     (0,0) — нижний левый угол
 *  - Конвертация: pdfY = pageHeight - elementY - elementHeight
 */

import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  degrees,
  PageSizes,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import type {
  CertificateTemplateData,
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  VariableSource,
} from "../types/certificate";

// ============================================================================
// КОНТЕКСТ ПЕРЕМЕННЫХ
// ============================================================================

export interface VariableContext {
  student: {
    id: string;
    fullName: string;
    organization: string;
    organizationUz?: string | null;
    organizationEn?: string | null;
    organizationRu?: string | null;
    position: string;
    department?: string | null;
    pinfl: string;
  };
  course: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    totalHours: number;
  };
  group: {
    id: string;
    code: string;
    startDate: Date | string;
    endDate: Date | string;
    classroom?: string | null;
  };
  certificate: {
    number: string;
    issueDate: Date;
    verificationUrl?: string;
  };
  instructor?: {
    id: string;
    fullName: string;
    position?: string | null;
  } | null;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

export function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;
  const lastName = parts[0];
  const initials = parts
    .slice(1)
    .map((p) => p.charAt(0).toUpperCase() + ".")
    .join("");
  return `${lastName} ${initials}`.trim();
}

export function formatDateFormatted(date: Date | string): string {
  const d = new Date(date);
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} года`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

// ============================================================================
// РАЗБОР CSS-ЦВЕТА → pdf-lib RGB
// ============================================================================

function parseCssColor(color: string): { r: number; g: number; b: number } {
  if (!color || color === "transparent") return { r: 0, g: 0, b: 0 };

  // #rrggbb или #rgb
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const n = parseInt(hex, 16);
    return {
      r: ((n >> 16) & 255) / 255,
      g: ((n >> 8) & 255) / 255,
      b: (n & 255) / 255,
    };
  }

  // rgb(r, g, b) или rgba(r, g, b, a)
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    return {
      r: parseInt(m[1]) / 255,
      g: parseInt(m[2]) / 255,
      b: parseInt(m[3]) / 255,
    };
  }

  return { r: 0, g: 0, b: 0 };
}

// ============================================================================
// КЭШИРОВАНИЕ ШРИФТОВ + ЗАГРУЗКА С GITHUB (google/fonts)
// ============================================================================

const fontCache = new Map<string, Uint8Array>();

// Папка с локальными TTF шрифтами (заполняется через scripts/download-fonts.mjs)
const FONT_ASSETS_DIR = path.join(process.cwd(), "server", "assets", "fonts");
// Дисковый кеш — заполняется автоматически при первой загрузке из сети
const FONT_DISK_CACHE = path.join(process.cwd(), "storage", ".font-cache");

function readLocalFont(filePath: string): Uint8Array | null {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 1000) return null;
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

/**
 * Маппинг шрифтов → пути в репозитории google/fonts на GitHub.
 *
 * ВАЖНО: jsDelivr CDN возвращает 403 для /static/ поддиректорий google/fonts.
 * Используем raw.githubusercontent.com напрямую.
 */
const GITHUB_FONT_MAP: Record<
  string,
  { repo: string; staticDir?: string; files: Record<number, string[]> }
> = {
  Inter: {
    repo: "ofl/inter",
    staticDir: "static",
    files: {
      400: ["Inter_18pt-Regular.ttf", "Inter-Regular.ttf"],
      700: ["Inter_18pt-Bold.ttf", "Inter-Bold.ttf"],
    },
  },
  Roboto: {
    repo: "apache/roboto",
    staticDir: "static",
    files: { 400: ["Roboto-Regular.ttf"], 700: ["Roboto-Bold.ttf"] },
  },
  "Open Sans": {
    repo: "apache/opensans",
    staticDir: "static",
    files: { 400: ["OpenSans-Regular.ttf"], 700: ["OpenSans-Bold.ttf"] },
  },
  Montserrat: {
    repo: "ofl/montserrat",
    staticDir: "static",
    files: { 400: ["Montserrat-Regular.ttf"], 700: ["Montserrat-Bold.ttf"] },
  },
  Lato: {
    repo: "ofl/lato",
    files: { 400: ["Lato-Regular.ttf"], 700: ["Lato-Bold.ttf"] },
  },
  Poppins: {
    repo: "ofl/poppins",
    files: { 400: ["Poppins-Regular.ttf"], 700: ["Poppins-Bold.ttf"] },
  },
  "Playfair Display": {
    repo: "ofl/playfairdisplay",
    staticDir: "static",
    files: {
      400: ["PlayfairDisplay-Regular.ttf"],
      700: ["PlayfairDisplay-Bold.ttf"],
    },
  },
  Lora: {
    repo: "ofl/lora",
    staticDir: "static",
    files: { 400: ["Lora-Regular.ttf"], 700: ["Lora-Bold.ttf"] },
  },
  Merriweather: {
    repo: "ofl/merriweather",
    files: {
      400: ["Merriweather-Regular.ttf"],
      700: ["Merriweather-Bold.ttf"],
    },
  },
  "PT Sans": {
    repo: "ofl/ptsans",
    files: { 400: ["PTSans-Regular.ttf"], 700: ["PTSans-Bold.ttf"] },
  },
  "PT Serif": {
    repo: "ofl/ptserif",
    files: { 400: ["PTSerif-Regular.ttf"], 700: ["PTSerif-Bold.ttf"] },
  },
  "Noto Sans": {
    repo: "ofl/notosans",
    files: { 400: ["NotoSans-Regular.ttf"], 700: ["NotoSans-Bold.ttf"] },
  },
  Raleway: {
    repo: "ofl/raleway",
    staticDir: "static",
    files: { 400: ["Raleway-Regular.ttf"], 700: ["Raleway-Bold.ttf"] },
  },
  Nunito: {
    repo: "ofl/nunito",
    staticDir: "static",
    files: { 400: ["Nunito-Regular.ttf"], 700: ["Nunito-Bold.ttf"] },
  },
  Oswald: {
    repo: "ofl/oswald",
    staticDir: "static",
    files: { 400: ["Oswald-Regular.ttf"], 700: ["Oswald-Bold.ttf"] },
  },
  "Source Sans Pro": {
    repo: "ofl/sourcesans3",
    staticDir: "static",
    files: {
      400: ["SourceSans3-Regular.ttf"],
      700: ["SourceSans3-Bold.ttf"],
    },
  },
  Ubuntu: {
    repo: "ufl/ubuntu",
    files: { 400: ["Ubuntu-Regular.ttf"], 700: ["Ubuntu-Bold.ttf"] },
  },
  Rubik: {
    repo: "ofl/rubik",
    staticDir: "static",
    files: { 400: ["Rubik-Regular.ttf"], 700: ["Rubik-Bold.ttf"] },
  },
  "Work Sans": {
    repo: "ofl/worksans",
    staticDir: "static",
    files: { 400: ["WorkSans-Regular.ttf"], 700: ["WorkSans-Bold.ttf"] },
  },
  "Fira Sans": {
    repo: "ofl/firasans",
    files: { 400: ["FiraSans-Regular.ttf"], 700: ["FiraSans-Bold.ttf"] },
  },
};

/** Строит список URL для загрузки шрифта (от приоритетного к запасным) */
function buildFontUrls(fontFamily: string, weight: number): string[] {
  const meta = GITHUB_FONT_MAP[fontFamily];
  if (!meta) return [];

  const fileNames = meta.files[weight] ?? [];
  const staticPart = meta.staticDir ? `/${meta.staticDir}` : "";
  const urls: string[] = [];

  for (const fileName of fileNames) {
    // raw.githubusercontent.com — прямой доступ без CDN-ограничений (ПРИОРИТЕТ)
    urls.push(
      `https://raw.githubusercontent.com/google/fonts/main/${meta.repo}${staticPart}/${fileName}`,
    );
    // Запасной: без subdirectory static/
    if (meta.staticDir) {
      urls.push(
        `https://raw.githubusercontent.com/google/fonts/main/${meta.repo}/${fileName}`,
      );
    }
  }

  return urls;
}

/**
 * Загружает TTF-шрифт. Порядок поиска:
 * 1. Память (Map — мгновенно)
 * 2. server/assets/fonts/ (TTF из download-fonts.mjs, если запускался)
 * 3. storage/.font-cache/ (дисковый кеш от предыдущих загрузок)
 * 4. C:\Windows\Fonts\ (системные Windows-шрифты: Georgia, Arial и др.)
 * 5. raw.githubusercontent.com/google/fonts (загрузка по требованию + кеш)
 */
async function fetchFontBytes(
  fontFamily: string,
  weight: number = 400,
): Promise<Uint8Array | null> {
  const key = `${fontFamily.replace(/\s+/g, "_")}-${weight}`;

  // 1. Память
  if (fontCache.has(key)) return fontCache.get(key)!;

  // 2. server/assets/fonts/
  const assetsBytes = readLocalFont(path.join(FONT_ASSETS_DIR, `${key}.ttf`));
  if (assetsBytes) {
    fontCache.set(key, assetsBytes);
    return assetsBytes;
  }

  // 3. Дисковый кеш
  const diskPath = path.join(FONT_DISK_CACHE, `${key}.ttf`);
  const diskBytes = readLocalFont(diskPath);
  if (diskBytes) {
    fontCache.set(key, diskBytes);
    return diskBytes;
  }

  // 4. Windows системные шрифты (Georgia, Arial, Tahoma и др.)
  const winBytes = readWindowsFont(fontFamily, weight);
  if (winBytes) {
    fontCache.set(key, winBytes);
    return winBytes;
  }

  // 5. Загрузка с raw.githubusercontent.com по требованию
  for (const url of buildFontUrls(fontFamily, weight)) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1000) continue;

      // Проверка magic bytes: TTF=0x00010000, OTF=0x4F54544F, true=0x74727565
      const magic = buffer.readUInt32BE(0);
      if (
        magic !== 0x00010000 &&
        magic !== 0x4f54544f &&
        magic !== 0x74727565 &&
        magic !== 0x74797031
      )
        continue;

      const bytes = new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength,
      );

      // Кешируем на диск для следующих запусков
      try {
        fs.mkdirSync(FONT_DISK_CACHE, { recursive: true });
        fs.writeFileSync(diskPath, buffer);
      } catch {
        /* некритично */
      }

      fontCache.set(key, bytes);
      console.log(
        `[pdfGenerator] Font loaded from GitHub: ${key} (${Math.round(buffer.length / 1024)} KB)`,
      );
      return bytes;
    } catch {
      /* пробуем следующий URL */
    }
  }

  console.warn(`[pdfGenerator] Font not available: ${fontFamily} ${weight}`);
  return null;
}

/**
 * Маппинг системных Windows-шрифтов на файлы в C:\Windows\Fonts
 * Поддерживает кириллицу и другие расширенные наборы символов.
 */
const WINDOWS_FONT_MAP: Record<string, Record<number, string>> = {
  Georgia: { 400: "georgia.ttf", 700: "georgiab.ttf" },
  Arial: { 400: "arial.ttf", 700: "arialbd.ttf" },
  "Arial Unicode MS": { 400: "ARIALUNICODEMS.TTF", 700: "ARIALUNICODEMS.TTF" },
  "Times New Roman": { 400: "times.ttf", 700: "timesbd.ttf" },
  Calibri: { 400: "calibri.ttf", 700: "calibrib.ttf" },
  Segoe: { 400: "segoeui.ttf", 700: "segoeuib.ttf" },
  "Segoe UI": { 400: "segoeui.ttf", 700: "segoeuib.ttf" },
  Verdana: { 400: "verdana.ttf", 700: "verdanab.ttf" },
  Tahoma: { 400: "tahoma.ttf", 700: "tahomabd.ttf" },
};

const WINDOWS_FONTS_DIR = "C:\\Windows\\Fonts";

/** Ищет шрифт в системных папках Windows (C:\Windows\Fonts) */
function readWindowsFont(
  fontFamily: string,
  weight: number,
): Uint8Array | null {
  const fileMap = WINDOWS_FONT_MAP[fontFamily];
  if (!fileMap) return null;

  const fileName = fileMap[weight] ?? fileMap[400];
  if (!fileName) return null;

  // Пробуем несколько регистров имени файла
  const attempts = [
    path.join(WINDOWS_FONTS_DIR, fileName),
    path.join(WINDOWS_FONTS_DIR, fileName.toLowerCase()),
    path.join(WINDOWS_FONTS_DIR, fileName.toUpperCase()),
  ];

  for (const p of attempts) {
    const bytes = readLocalFont(p);
    if (bytes) return bytes;
  }
  return null;
}

/**
 * Загружает Cyrillic-совместимый fallback-шрифт.
 * Порядок попыток: Roboto → Lato → Poppins → Ubuntu
 * Все эти шрифты поддерживают кириллицу и уже скачаны
 * в server/assets/fonts/ при запуске download-fonts.mjs.
 */
async function getFallbackFont(
  pdfDoc: PDFDocument,
  weight: number,
): Promise<PDFFont | null> {
  pdfDoc.registerFontkit(fontkit);

  // Цепочка Cyrillic-совместимых шрифтов (в порядке предпочтения)
  const fallbackChain = ["Roboto", "Lato", "Poppins", "Ubuntu"];

  for (const family of fallbackChain) {
    const bytes = await fetchFontBytes(family, weight);
    if (bytes) {
      try {
        return await pdfDoc.embedFont(bytes);
      } catch {
        /* пробуем следующий */
      }
    }
  }
  return null;
}

async function getEmbeddedFont(
  pdfDoc: PDFDocument,
  fontFamily: string,
  fontWeight: string,
  fontStyle: string,
): Promise<PDFFont> {
  const weight =
    fontWeight === "bold" || parseInt(fontWeight) >= 700 ? 700 : 400;
  const isItalic = fontStyle === "italic";

  // Стандартные шрифты только для латиницы (WinAnsi — нет кириллицы)
  // Times New Roman и Courier используются редко и обычно с латиницей
  const standardFonts: Record<string, StandardFonts> = {
    "Times New Roman": isItalic
      ? weight >= 700
        ? StandardFonts.TimesRomanBoldItalic
        : StandardFonts.TimesRomanItalic
      : weight >= 700
        ? StandardFonts.TimesRomanBold
        : StandardFonts.TimesRoman,
    "Courier New": isItalic
      ? weight >= 700
        ? StandardFonts.CourierBoldOblique
        : StandardFonts.CourierOblique
      : weight >= 700
        ? StandardFonts.CourierBold
        : StandardFonts.Courier,
    Courier: isItalic
      ? weight >= 700
        ? StandardFonts.CourierBoldOblique
        : StandardFonts.CourierOblique
      : weight >= 700
        ? StandardFonts.CourierBold
        : StandardFonts.Courier,
  };

  if (standardFonts[fontFamily]) {
    return pdfDoc.embedFont(standardFonts[fontFamily]);
  }

  // Загружаем запрошенный шрифт из Google Fonts (TTF)
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await fetchFontBytes(fontFamily, weight);
  if (fontBytes) {
    try {
      return await pdfDoc.embedFont(fontBytes);
    } catch {
      console.warn(
        `[pdfGenerator] Failed to embed font ${fontFamily}, trying Roboto fallback`,
      );
    }
  }

  // Fallback: Roboto — поддерживает кириллицу, латиницу, узбекский
  const roboto = await getFallbackFont(pdfDoc, weight);
  if (roboto) return roboto;

  // Последний резерв: Helvetica (только латиница — для PDF без кириллицы)
  console.warn(
    `[pdfGenerator] Using Helvetica for "${fontFamily}" — Cyrillic may not render`,
  );
  const fallback =
    weight >= 700
      ? isItalic
        ? StandardFonts.HelveticaBoldOblique
        : StandardFonts.HelveticaBold
      : isItalic
        ? StandardFonts.HelveticaOblique
        : StandardFonts.Helvetica;
  return pdfDoc.embedFont(fallback);
}

// ============================================================================
// РАЗРЕШЕНИЕ ПЕРЕМЕННЫХ
// ============================================================================

export function resolveVariable(
  key: VariableSource,
  context: VariableContext,
): string {
  const { student, course, group, certificate } = context;
  const nameParts = student.fullName.split(/\s+/);

  switch (key) {
    case "student.fullName":
      return student.fullName;
    case "student.shortName":
      return getShortName(student.fullName);
    case "student.lastName":
      return nameParts[0] || "";
    case "student.firstName":
      return nameParts[1] || "";
    case "student.middleName":
      return nameParts[2] || "";
    case "student.firstLastName":
      return `${(nameParts[0] || "").toUpperCase()} ${(nameParts[1] || "").toUpperCase()}`.trim();
    case "student.organization":
      return student.organization;
    case "student.organizationUz":
      return student.organizationUz || "";
    case "student.organizationEn":
      return student.organizationEn || "";
    case "student.organizationRu":
      return student.organizationRu || "";
    case "student.position":
      return student.position;
    case "student.department":
      return student.department || "";
    case "student.pinfl":
      return student.pinfl;
    case "course.name":
      return course.name;
    case "course.shortName":
      return course.shortName;
    case "course.code":
      return course.code;
    case "course.totalHours":
      return course.totalHours.toString();
    case "course.description":
      return "";
    case "group.code":
      return group.code;
    case "group.startDate":
      return formatDate(group.startDate);
    case "group.endDate":
      return formatDate(group.endDate);
    case "group.classroom":
      return group.classroom || "";
    case "certificate.number":
      return certificate.number;
    case "certificate.issueDate":
      return formatDate(certificate.issueDate);
    case "certificate.issueDateFormatted":
      return formatDateFormatted(certificate.issueDate);
    case "instructor.fullName":
      return context.instructor?.fullName || "";
    case "instructor.shortName":
      return context.instructor?.fullName
        ? getShortName(context.instructor.fullName)
        : "";
    case "instructor.position":
      return context.instructor?.position || "";
    case "custom":
      return "";
    default:
      console.warn(`[pdfGenerator] Unknown variable: ${key}`);
      return `[${key}]`;
  }
}

// ============================================================================
// ЗАГРУЗКА ИЗОБРАЖЕНИЯ
// ============================================================================

async function loadImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("data:image/")) {
      const base64 = url.split(",")[1];
      return Buffer.from(base64, "base64");
    }

    if (url.startsWith("/uploads/") || url.startsWith("/storage/")) {
      const cleanUrl = url.split("?")[0];
      const publicDir = path.join(process.cwd(), "public");
      const filePath = path.join(publicDir, cleanUrl);
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
    }

    // Абсолютный URL
    if (url.startsWith("http")) {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// ГЕНЕРАЦИЯ PDF
// ============================================================================

interface GeneratePdfOptions {
  templateData: CertificateTemplateData;
  context: VariableContext;
  outputPath: string;
}

/**
 * Основная функция: рисует все элементы шаблона на PDF-странице
 */
async function buildPdf(
  templateData: CertificateTemplateData,
  context: VariableContext,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const pageWidth = templateData.width;
  const pageHeight = templateData.height;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // ── Фон ────────────────────────────────────────────────────
  if (templateData.background) {
    if (
      templateData.background.type === "color" &&
      templateData.background.value !== "transparent"
    ) {
      const c = parseCssColor(templateData.background.value);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(c.r, c.g, c.b),
      });
    } else if (templateData.background.type === "image") {
      const imgBuffer = await loadImageBuffer(templateData.background.value);
      if (imgBuffer) {
        try {
          const ext = templateData.background.value
            .split("?")[0]
            .split(".")
            .pop()
            ?.toLowerCase();
          const img =
            ext === "jpg" || ext === "jpeg"
              ? await pdfDoc.embedJpg(imgBuffer)
              : await pdfDoc.embedPng(imgBuffer);
          page.drawImage(img, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });
        } catch (e) {
          console.warn("[pdfGenerator] Could not embed background image:", e);
        }
      }
    }
  }

  // ── Элементы (сортируем по zIndex) ─────────────────────────
  const sorted = [...templateData.elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const element of sorted) {
    try {
      await drawElement(pdfDoc, page, element, context, pageWidth, pageHeight);
    } catch (e) {
      console.warn(`[pdfGenerator] Failed to draw element ${element.id}:`, e);
    }
  }

  return pdfDoc.save();
}

/**
 * Конвертирует Y из системы HTML (top-left) в систему PDF (bottom-left)
 */
function toPdfY(
  htmlY: number,
  elementHeight: number,
  pageHeight: number,
): number {
  return pageHeight - htmlY - elementHeight;
}

/**
 * Вычисляет скорректированный origin (drawX, drawY) для pdf-lib при повороте вокруг центра элемента.
 *
 * pdf-lib применяет rotate вокруг точки (x, y) — нижнего-левого угла в системе PDF.
 * В HTML/CSS шаблоне поворот — всегда вокруг центра (transform-origin: center center).
 *
 * Формула: смещаем точку рисования обратным поворотом offset (-w/2, -h/2) от центра,
 * чтобы после применения поворота pdf-lib визуальный центр элемента остался на месте.
 */
function rotatedOrigin(
  x: number,
  y: number,
  w: number,
  h: number,
  rotDeg: number,
): { drawX: number; drawY: number } {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rad = (-rotDeg * Math.PI) / 180;
  const offX = -w / 2;
  const offY = -h / 2;
  const drawX = cx + offX * Math.cos(rad) - offY * Math.sin(rad);
  const drawY = cy + offX * Math.sin(rad) + offY * Math.cos(rad);
  return { drawX, drawY };
}

/**
 * Рисует один элемент шаблона на странице
 */
async function drawElement(
  pdfDoc: PDFDocument,
  page: PDFPage,
  element: TemplateElement,
  context: VariableContext,
  pageWidth: number,
  pageHeight: number,
): Promise<void> {
  const x = element.x;
  const y = toPdfY(element.y, element.height, pageHeight);
  const w = element.width;
  const h = element.height;

  switch (element.type) {
    case "text":
    case "variable": {
      const el = element as TextElement | VariableElement;
      const text =
        element.type === "variable"
          ? resolveVariable((el as VariableElement).variableKey, context)
          : (el as TextElement).content;

      if (!text) break;

      const font = await getEmbeddedFont(
        pdfDoc,
        el.fontFamily,
        el.fontWeight,
        el.fontStyle,
      );
      const fontSize = el.fontSize;
      const c = parseCssColor(el.color);
      const lineH = (el.lineHeight as number) * fontSize;
      const textAlign = el.textAlign || "left";

      // ── Ручной перенос строк ──────────────────────────────────
      // pdf-lib при maxWidth переносит текст, но дополнительные строки
      // всегда рисует от исходного x. Поэтому выравнивание (center/right)
      // для многострочных текстов работает только с ручным разбиением.
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        // Обработка явных переносов строк в тексте
        const parts = word.split("\n");
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const testLine = currentLine ? currentLine + " " + part : part;
          let testWidth = 0;
          try {
            testWidth = font.widthOfTextAtSize(testLine, fontSize);
          } catch {
            testWidth = w + 1;
          }
          if (testWidth > w && currentLine) {
            lines.push(currentLine);
            currentLine = part;
          } else {
            currentLine = testLine;
          }
          // Явный перенос строки (не последняя часть)
          if (i < parts.length - 1) {
            lines.push(currentLine);
            currentLine = "";
          }
        }
      }
      if (currentLine) lines.push(currentLine);

      // ── Вычисляем стартовую Y с учётом количества строк ───────
      // Вертикально центрируем весь блок текста внутри элемента
      const totalTextHeight = lines.length * lineH - (lineH - fontSize);
      let currentY = y + h / 2 + totalTextHeight / 2 - fontSize;

      // ── Рисуем каждую строку с правильным x ───────────────────
      for (const line of lines) {
        let lineX = x;
        try {
          const lineWidth = font.widthOfTextAtSize(line, fontSize);
          if (textAlign === "center") lineX = x + (w - lineWidth) / 2;
          else if (textAlign === "right") lineX = x + w - lineWidth;
        } catch {
          // Оставляем x
        }

        page.drawText(line, {
          x: lineX,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(c.r, c.g, c.b),
          ...(element.rotation ? { rotate: degrees(-element.rotation) } : {}),
        });

        currentY -= lineH;
      }
      break;
    }

    case "image": {
      const el = element as ImageElement;
      const imgBuffer = await loadImageBuffer(el.src);
      if (!imgBuffer) break;

      try {
        const srcLower = el.src.split("?")[0].toLowerCase();
        const isJpeg =
          srcLower.endsWith(".jpg") ||
          srcLower.endsWith(".jpeg") ||
          el.src.startsWith("data:image/jpeg");
        const img = isJpeg
          ? await pdfDoc.embedJpg(imgBuffer)
          : await pdfDoc.embedPng(imgBuffer);

        const imgRotDeg = element.rotation ?? 0;
        // pdf-lib поворачивает вокруг (x, y) — нижнего-левого угла.
        // Компенсируем смещение для поворота вокруг центра элемента.
        const { drawX: imgDrawX, drawY: imgDrawY } =
          imgRotDeg !== 0
            ? rotatedOrigin(x, y, w, h, imgRotDeg)
            : { drawX: x, drawY: y };

        page.drawImage(img, {
          x: imgDrawX,
          y: imgDrawY,
          width: w,
          height: h,
          opacity: el.opacity ?? 1,
          ...(imgRotDeg !== 0 ? { rotate: degrees(-imgRotDeg) } : {}),
        });
      } catch (e) {
        console.warn("[pdfGenerator] Image embed failed:", e);
      }
      break;
    }

    case "qr": {
      const el = element as QRElement;
      let qrData = "";

      switch (el.dataSource) {
        case "certificate_url":
          qrData =
            context.certificate.verificationUrl ||
            `https://example.com/verify/${context.certificate.number}`;
          break;
        case "certificate_number":
          qrData = context.certificate.number;
          break;
        case "custom":
          qrData = el.customData || "";
          break;
        case "custom_url":
          qrData = `${(el.customData || "").replace(/\/$/, "")}/verify/${context.certificate.number}`;
          break;
      }

      try {
        const qrPngBuffer = await QRCode.toBuffer(qrData, {
          width: Math.min(w, h),
          margin: 1,
          color: {
            dark: el.color?.replace("#", "") || "000000FF",
            light: el.backgroundColor?.replace("#", "") || "FFFFFFFF",
          },
        });

        const qrImg = await pdfDoc.embedPng(qrPngBuffer);
        page.drawImage(qrImg, { x, y, width: w, height: h });
      } catch (e) {
        console.warn("[pdfGenerator] QR generation failed:", e);
      }
      break;
    }

    case "shape": {
      const el = element as ShapeElement;
      const fillC =
        el.fillColor && el.fillColor !== "transparent"
          ? parseCssColor(el.fillColor)
          : null;
      const strokeC = parseCssColor(el.strokeColor || "#000000");
      const shapeRotDeg = element.rotation ?? 0;

      if (el.shapeType === "rectangle") {
        // Компенсируем pivot: pdf-lib поворачивает вокруг (x,y), а нужно — вокруг центра
        const { drawX: rectX, drawY: rectY } =
          shapeRotDeg !== 0
            ? rotatedOrigin(x, y, w, h, shapeRotDeg)
            : { drawX: x, drawY: y };

        page.drawRectangle({
          x: rectX,
          y: rectY,
          width: w,
          height: h,
          ...(fillC
            ? { color: rgb(fillC.r, fillC.g, fillC.b) }
            : { color: undefined }),
          borderColor: rgb(strokeC.r, strokeC.g, strokeC.b),
          borderWidth: el.strokeWidth || 1,
          ...(shapeRotDeg !== 0 ? { rotate: degrees(-shapeRotDeg) } : {}),
        });
      } else if (el.shapeType === "circle") {
        // Эллипс задаётся центром — поворот уже относительно центра, компенсация не нужна
        page.drawEllipse({
          x: x + w / 2,
          y: y + h / 2,
          xScale: w / 2,
          yScale: h / 2,
          ...(fillC
            ? { color: rgb(fillC.r, fillC.g, fillC.b) }
            : { color: undefined }),
          borderColor: rgb(strokeC.r, strokeC.g, strokeC.b),
          borderWidth: el.strokeWidth || 1,
          ...(shapeRotDeg !== 0 ? { rotate: degrees(-shapeRotDeg) } : {}),
        });
      } else if (el.shapeType === "line") {
        // Для линии не используем rotate pdf-lib (она поворачивает вокруг start-точки).
        // Вместо этого поворачиваем конечные точки математически вокруг центра bbox.
        if (shapeRotDeg !== 0) {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const rad = (-shapeRotDeg * Math.PI) / 180;

          // Опорные точки линии (диагональ bbox в системе PDF)
          const sx0 = x;
          const sy0 = y + h; // start: левый-нижний
          const ex0 = x + w;
          const ey0 = y; // end:   правый-верхний

          const startX =
            cx + (sx0 - cx) * Math.cos(rad) - (sy0 - cy) * Math.sin(rad);
          const startY =
            cy + (sx0 - cx) * Math.sin(rad) + (sy0 - cy) * Math.cos(rad);
          const endX =
            cx + (ex0 - cx) * Math.cos(rad) - (ey0 - cy) * Math.sin(rad);
          const endY =
            cy + (ex0 - cx) * Math.sin(rad) + (ey0 - cy) * Math.cos(rad);

          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            color: rgb(strokeC.r, strokeC.g, strokeC.b),
            thickness: el.strokeWidth || 1,
          });
        } else {
          page.drawLine({
            start: { x, y: y + h },
            end: { x: x + w, y },
            color: rgb(strokeC.r, strokeC.g, strokeC.b),
            thickness: el.strokeWidth || 1,
          });
        }
      }
      break;
    }
  }
}

// ============================================================================
// ПУБЛИЧНОЕ API
// ============================================================================

/**
 * Генерировать PDF сертификата и сохранить на диск
 */
export async function generateCertificatePdf(
  options: GeneratePdfOptions,
): Promise<void> {
  const { templateData, context, outputPath } = options;

  console.log("[pdfGenerator] Starting PDF generation (pdf-lib)...");
  console.log(
    `[pdfGenerator] Template size: ${templateData.width}x${templateData.height}`,
  );
  console.log(`[pdfGenerator] Elements: ${templateData.elements.length}`);

  const pdfBytes = await buildPdf(templateData, context);

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`[pdfGenerator] PDF saved to: ${outputPath}`);
}

/**
 * Генерировать PDF сертификата как Buffer
 */
export async function generateCertificatePdfBuffer(
  templateData: CertificateTemplateData,
  context: VariableContext,
): Promise<Buffer> {
  console.log("[pdfGenerator] Generating PDF buffer (pdf-lib)...");
  const pdfBytes = await buildPdf(templateData, context);
  console.log("[pdfGenerator] PDF buffer generated");
  return Buffer.from(pdfBytes);
}

// ============================================================================
// HTML ПРЕДПРОСМОТР (для iframe в браузере, без Puppeteer)
// ============================================================================

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (m) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }) as Record<string, string>
      )[m] || m,
  );
}

async function convertForPreview(url: string): Promise<string> {
  if (!url || url.startsWith("data:image/")) return url;
  if (url.startsWith("/uploads/") || url.startsWith("/storage/")) {
    try {
      const cleanUrl = url.split("?")[0];
      const filePath = path.join(process.cwd(), "public", cleanUrl);
      if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime =
          ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
              ? "image/png"
              : ext === ".webp"
                ? "image/webp"
                : ext === ".svg"
                  ? "image/svg+xml"
                  : "image/png";
        return `data:${mime};base64,${buf.toString("base64")}`;
      }
    } catch {
      /* ignore */
    }
  }
  return url;
}

async function elementToHtml(
  element: TemplateElement,
  context: VariableContext,
): Promise<string> {
  const base = `position:absolute;left:${element.x}px;top:${element.y}px;width:${element.width}px;height:${element.height}px;${element.rotation ? `transform:rotate(${element.rotation}deg);` : ""}`;

  switch (element.type) {
    case "text":
    case "variable": {
      const el = element as TextElement | VariableElement;
      const text =
        element.type === "variable"
          ? resolveVariable((el as VariableElement).variableKey, context)
          : (el as TextElement).content;
      const justify =
        el.textAlign === "left"
          ? "flex-start"
          : el.textAlign === "right"
            ? "flex-end"
            : "center";
      const style = `font-family:'${el.fontFamily}',sans-serif;font-size:${el.fontSize}px;font-weight:${el.fontWeight};font-style:${el.fontStyle};text-align:${el.textAlign};color:${el.color};line-height:${el.lineHeight};display:flex;align-items:center;justify-content:${justify};white-space:pre-wrap;word-break:break-word;`;
      return `<div style="${base}${style}">${escapeHtml(text)}</div>`;
    }
    case "image": {
      const el = element as ImageElement;
      const src = await convertForPreview(el.src);
      return `<div style="${base}"><img src="${src}" style="width:100%;height:100%;object-fit:${el.objectFit};opacity:${el.opacity ?? 1};" /></div>`;
    }
    case "qr": {
      const el = element as QRElement;
      let qrData = "";
      if (el.dataSource === "certificate_url")
        qrData =
          context.certificate.verificationUrl ||
          `https://example.com/verify/${context.certificate.number}`;
      else if (el.dataSource === "certificate_number")
        qrData = context.certificate.number;
      else if (el.dataSource === "custom") qrData = el.customData || "";
      else if (el.dataSource === "custom_url")
        qrData = `${(el.customData || "").replace(/\/$/, "")}/verify/${context.certificate.number}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: el.size,
        margin: 1,
        color: { dark: el.color, light: el.backgroundColor },
      });
      return `<div style="${base}"><img src="${qrDataUrl}" style="width:100%;height:100%;" /></div>`;
    }
    case "shape": {
      const el = element as ShapeElement;
      const fill =
        el.fillColor === "transparent" ? "transparent" : el.fillColor;
      if (el.shapeType === "rectangle")
        return `<div style="${base}background:${fill};border:${el.strokeWidth}px solid ${el.strokeColor};box-sizing:border-box;"></div>`;
      if (el.shapeType === "circle")
        return `<div style="${base}background:${fill};border:${el.strokeWidth}px solid ${el.strokeColor};border-radius:50%;box-sizing:border-box;"></div>`;
      if (el.shapeType === "line")
        return `<svg style="${base}" viewBox="0 0 ${el.width} ${el.height}"><line x1="0" y1="0" x2="${el.width}" y2="${el.height}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"/></svg>`;
      return "";
    }
    default:
      return "";
  }
}

/**
 * Генерирует HTML-представление сертификата для предпросмотра в браузере (iframe srcdoc).
 * Не требует Puppeteer — рендерит сам браузер.
 */
export async function generateCertificateHtml(
  templateData: CertificateTemplateData,
  context: VariableContext,
): Promise<string> {
  const sorted = [...templateData.elements].sort((a, b) => a.zIndex - b.zIndex);
  const elementsHtml: string[] = [];
  for (const el of sorted) {
    elementsHtml.push(await elementToHtml(el, context));
  }

  let backgroundStyle = "";
  if (templateData.background) {
    if (templateData.background.type === "color") {
      backgroundStyle = `background-color:${templateData.background.value};`;
    } else if (templateData.background.type === "image") {
      const imgUrl = await convertForPreview(templateData.background.value);
      backgroundStyle = `background-image:url(${imgUrl});background-size:cover;background-position:center;`;
    }
  }

  const fonts = new Set<string>();
  for (const el of templateData.elements) {
    if (el.type === "text" || el.type === "variable")
      fonts.add((el as TextElement).fontFamily);
  }
  const fontLinks = Array.from(fonts)
    .filter(
      (f) =>
        !["Arial", "Times New Roman", "Georgia", "Courier New"].includes(f),
    )
    .map(
      (f) =>
        `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;700&display=swap" rel="stylesheet">`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${fontLinks}
<style>*{margin:0;padding:0;box-sizing:border-box;}body{width:${templateData.width}px;height:${templateData.height}px;position:relative;overflow:hidden;${backgroundStyle}font-family:'Inter',Arial,sans-serif;}</style>
</head><body>${elementsHtml.join("\n")}</body></html>`;
}
