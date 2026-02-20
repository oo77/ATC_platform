/**
 * PDF Processor - Обработка PDF файлов
 *
 * Рендеринг страниц PDF → изображение (PNG) через pdfjs-dist + @napi-rs/canvas.
 * Без Puppeteer/Chromium, без sharp.
 */

import { PDFDocument } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import fs from "fs/promises";
import path from "path";

// ============================================================
// Инициализация pdfjs-dist для Node.js
// ============================================================
// pdfjs-dist v5 использует DOMMatrix — берём из @napi-rs/canvas
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  // Минимальный полифилл DOMMatrix для pdfjs-dist
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      }
    }
    multiply() {
      return new (globalThis as any).DOMMatrix();
    }
    translate(tx = 0, ty = 0) {
      return new (globalThis as any).DOMMatrix([
        this.a,
        this.b,
        this.c,
        this.d,
        this.e + tx,
        this.f + ty,
      ]);
    }
    scale(sx = 1, sy = sx) {
      return new (globalThis as any).DOMMatrix([
        this.a * sx,
        this.b * sy,
        this.c * sx,
        this.d * sy,
        this.e,
        this.f,
      ]);
    }
    rotate(angle = 0) {
      const r = (angle * Math.PI) / 180,
        c = Math.cos(r),
        s = Math.sin(r);
      return new (globalThis as any).DOMMatrix([c, s, -s, c, 0, 0]);
    }
    inverse() {
      return new (globalThis as any).DOMMatrix();
    }
    flipX() {
      return new (globalThis as any).DOMMatrix([
        -this.a,
        this.b,
        this.c,
        this.d,
        this.e,
        this.f,
      ]);
    }
    flipY() {
      return new (globalThis as any).DOMMatrix([
        this.a,
        -this.b,
        this.c,
        this.d,
        this.e,
        this.f,
      ]);
    }
    skewX() {
      return new (globalThis as any).DOMMatrix();
    }
    skewY() {
      return new (globalThis as any).DOMMatrix();
    }
    transformPoint(p: any = {}) {
      return { x: p.x || 0, y: p.y || 0, z: 0, w: 1 };
    }
    toFloat32Array() {
      return new Float32Array([this.a, this.b, this.c, this.d, this.e, this.f]);
    }
    toFloat64Array() {
      return new Float64Array([this.a, this.b, this.c, this.d, this.e, this.f]);
    }
    toString() {
      return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`;
    }
    static fromMatrix() {
      return new (globalThis as any).DOMMatrix();
    }
    static fromFloat32Array(a: Float32Array) {
      return new (globalThis as any).DOMMatrix(Array.from(a));
    }
    static fromFloat64Array(a: Float64Array) {
      return new (globalThis as any).DOMMatrix(Array.from(a));
    }
  };
}

let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  }
  return pdfjsLib;
}

// ============================================================
// КОНСТАНТЫ
// ============================================================

const STORAGE_PATH = path.join(process.cwd(), "storage", "library");
const ORIGINALS_PATH = path.join(STORAGE_PATH, "originals");
const CACHE_PATH = path.join(STORAGE_PATH, "cache");
const COVERS_PATH = path.join(STORAGE_PATH, "covers");

const PAGE_IMAGE_CONFIG = {
  scale: 2.0,
  format: "png" as const, // WebP заменён на PNG (убран sharp)
};

const COVER_CONFIG = {
  width: 400,
  format: "png" as const,
};

// ============================================================
// ТИПЫ
// ============================================================

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получить изображение страницы (из кэша или сгенерировать)
 */
export async function getPageImage(
  bookId: string,
  pageNumber: number,
  pdfPath?: string,
): Promise<Buffer> {
  const cacheDir = path.join(CACHE_PATH, bookId);
  const cacheFile = path.join(
    cacheDir,
    `page_${String(pageNumber).padStart(3, "0")}.${PAGE_IMAGE_CONFIG.format}`,
  );

  // Проверяем кэш
  try {
    return await fs.readFile(cacheFile);
  } catch {
    // Кэша нет — генерируем
  }

  if (!pdfPath) {
    throw new Error("PDF path is required for generation");
  }

  console.log(
    `[PDF] Cache miss. Generating page ${pageNumber} for book ${bookId}`,
  );

  const imageBuffer = await renderPdfPage(pdfPath, pageNumber);

  await ensureDir(cacheDir);
  await fs.writeFile(cacheFile, imageBuffer);

  return imageBuffer;
}

/**
 * Рендеринг страницы PDF через pdfjs-dist + @napi-rs/canvas
 */
async function renderPdfPage(
  pdfPath: string,
  pageNumber: number,
): Promise<Buffer> {
  const pdfjs = await getPdfJs();

  const pdfBytes = await fs.readFile(pdfPath);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;

  if (pageNumber < 1 || pageNumber > doc.numPages) {
    throw new Error(`Page ${pageNumber} out of range (total: ${doc.numPages})`);
  }

  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: PAGE_IMAGE_CONFIG.scale });

  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  const ctx = canvas.getContext("2d");

  await page.render({
    canvasContext: ctx as any,
    viewport,
  }).promise;

  await doc.destroy();

  return canvas.toBuffer("image/png");
}

/**
 * Генерировать обложку (первая страница, уменьшенная до COVER_CONFIG.width)
 */
export async function generateCover(
  bookId: string,
  pdfPath: string,
): Promise<string> {
  const pdfjs = await getPdfJs();

  const pdfBytes = await fs.readFile(pdfPath);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);

  // Вычисляем масштаб для желаемой ширины
  const naturalViewport = page.getViewport({ scale: 1.0 });
  const scale = COVER_CONFIG.width / naturalViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  const ctx = canvas.getContext("2d");

  await page.render({ canvasContext: ctx as any, viewport }).promise;
  await doc.destroy();

  const coverBuffer = canvas.toBuffer("image/png");

  await ensureDir(COVERS_PATH);
  const coverFilename = `${bookId}.${COVER_CONFIG.format}`;
  const coverPath = path.join(COVERS_PATH, coverFilename);
  await fs.writeFile(coverPath, coverBuffer);

  console.log(`✅ Обложка создана: ${coverPath}`);
  return `library/covers/${coverFilename}`;
}

/**
 * Извлечь метаданные и количество страниц (через pdf-lib — чистый JS)
 */
export async function getPDFInfo(pdfPath: string): Promise<{
  pageCount: number;
  metadata: PDFMetadata;
}> {
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  return {
    pageCount: pdfDoc.getPageCount(),
    metadata: {
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      creator: pdfDoc.getCreator() || undefined,
      producer: pdfDoc.getProducer() || undefined,
      creationDate: pdfDoc.getCreationDate() || undefined,
      modificationDate: pdfDoc.getModificationDate() || undefined,
    },
  };
}

/**
 * Получить количество страниц (legacy wrapper)
 */
export async function getPDFPageCount(pdfPath: string): Promise<number> {
  const info = await getPDFInfo(pdfPath);
  return info.pageCount;
}

/**
 * Удалить файлы кэша книги
 */
export async function deleteBookFiles(bookId: string): Promise<void> {
  try {
    const cacheDir = path.join(CACHE_PATH, bookId);
    await fs.rm(cacheDir, { recursive: true, force: true });

    const coverPath = path.join(COVERS_PATH, `${bookId}.png`);
    await fs.rm(coverPath, { force: true });

    console.log(`✅ Файлы кэша и обложки книги ${bookId} удалены`);
  } catch (error) {
    console.error("❌ Ошибка удаления файлов книги:", error);
  }
}
