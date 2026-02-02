/**
 * PDF Processor - Обработка PDF файлов
 *
 * Функции:
 * - Рендеринг страницы PDF в изображение (по запросу)
 * - Генерация обложки из первой страницы
 * - Извлечение метаданных
 */

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// ========================================
// КОНСТАНТЫ
// ========================================

const STORAGE_PATH = path.join(process.cwd(), "storage", "library");
const ORIGINALS_PATH = path.join(STORAGE_PATH, "originals");
const CACHE_PATH = path.join(STORAGE_PATH, "cache");
const COVERS_PATH = path.join(STORAGE_PATH, "covers");

// Настройки качества изображений
const PAGE_IMAGE_CONFIG = {
  width: 1200, // Ширина страницы в пикселях
  quality: 85, // Качество WebP
  format: "webp" as const,
};

const COVER_IMAGE_CONFIG = {
  width: 400, // Ширина обложки
  quality: 90,
  format: "webp" as const,
};

// ========================================
// ТИПЫ
// ========================================

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// ========================================
// ОСНОВНЫЕ ФУНКЦИИ
// ========================================

/**
 * Получить изображение страницы (из кэша или сгенерировать)
 */
export async function getPageImage(
  bookId: string,
  pageNumber: number,
  pdfPath?: string, // Если не передан, попробуем найти в originals по bookId
): Promise<Buffer> {
  // 1. Проверяем кэш
  const cacheDir = path.join(CACHE_PATH, bookId);
  const cacheFile = path.join(
    cacheDir,
    `page_${String(pageNumber).padStart(3, "0")}.${PAGE_IMAGE_CONFIG.format}`,
  );

  try {
    const cachedImage = await fs.readFile(cacheFile);
    return cachedImage;
  } catch {
    // Кэша нет, нужно генерировать
  }

  // 2. Если кэша нет, генерируем
  if (!pdfPath) {
    throw new Error("PDF path is required for generation");
  }

  console.log(
    `[PDF] Cache miss. Generating page ${pageNumber} for book ${bookId}`,
  );

  // Генерируем изображение
  const imageBuffer = await renderPdfPage(pdfPath, pageNumber);

  // 3. Сохраняем в кэш
  await ensureDir(cacheDir);
  await fs.writeFile(cacheFile, imageBuffer);

  return imageBuffer;
}

/**
 * Рендеринг конкретной страницы PDF через Puppeteer
 */
// Глобальный инстанс браузера для переиспользования
let browserInstance: any = null;
let browserCloseTimeout: NodeJS.Timeout | null = null;

async function getBrowser() {
  // Сбрасываем таймер закрытия при каждом обращении
  if (browserCloseTimeout) {
    clearTimeout(browserCloseTimeout);
    browserCloseTimeout = null;
  }

  // Если браузер не запущен или закрыт, запускаем
  if (!browserInstance) {
    const puppeteer = await import("puppeteer");
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ], // Оптимизация памяти
    });
    console.log("[PDF] Started new Puppeteer browser instance");
  }

  // Планируем закрытие через 2 минуты простоя
  browserCloseTimeout = setTimeout(async () => {
    if (browserInstance) {
      console.log("[PDF] Closing idle Puppeteer browser instance");
      await browserInstance.close();
      browserInstance = null;
    }
  }, 120000);

  return browserInstance;
}

/**
 * Рендеринг конкретной страницы PDF через Puppeteer (Singleton)
 */
async function renderPdfPage(
  pdfPath: string,
  pageNumber: number,
): Promise<Buffer> {
  const browser = await getBrowser();
  let page = null;

  try {
    // Читаем PDF файл как base64 (это быстро)
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfBase64 = pdfBytes.toString("base64");

    page = await browser.newPage();

    // Оптимизация: отключаем лишнее
    await page.setRequestInterception(true);
    page.on("request", (req: any) => {
      const resourceType = req.resourceType();
      if (resourceType === "script" || resourceType === "document") {
        req.continue();
      } else {
        req.abort();
      }
    });

    await page.setContent(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        </script>
        <style>
          body { margin: 0; overflow: hidden; background: white; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <canvas id="the-canvas"></canvas>
      </body>
      </html>
    `,
      { waitUntil: "domcontentloaded" },
    ); // Ждем только DOM

    // Рендерим страницу
    await page.evaluate(
      async (pdfData: string, num: number) => {
        // @ts-ignore
        const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
        // @ts-ignore
        const pdfDoc = await loadingTask.promise;

        if (num > pdfDoc.numPages || num < 1) {
          throw new Error("Page number out of range");
        }

        const pdfPage = await pdfDoc.getPage(num);
        // Scale 2.0
        const viewport = pdfPage.getViewport({ scale: 2.0 });

        // @ts-ignore
        const canvas = document.getElementById("the-canvas");
        // @ts-ignore
        const context = canvas.getContext("2d");
        // @ts-ignore
        canvas.height = viewport.height;
        // @ts-ignore
        canvas.width = viewport.width;

        await pdfPage.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      },
      pdfBase64,
      pageNumber,
    );

    // @ts-ignore
    const canvasElement = await page.$("#the-canvas");
    if (!canvasElement) {
      throw new Error("Canvas element not found");
    }

    const screenshot = await canvasElement.screenshot({ type: "png" }); // PNG быстрее жмется Puppeteer'ом чем WebP

    // Оптимизация sharp
    const outputBuffer = await sharp(screenshot)
      .webp({ quality: PAGE_IMAGE_CONFIG.quality })
      .toBuffer();

    return outputBuffer;
  } catch (error) {
    console.error(`[PDF] Error rendering page ${pageNumber}:`, error);
    throw error;
  } finally {
    if (page) {
      await page.close(); // Закрываем только страницу, браузер оставляем
    }
  }
}

/**
 * Генерировать обложку из первой страницы
 */
export async function generateCover(
  bookId: string,
  pdfPath: string,
): Promise<string> {
  try {
    const firstPageBuffer = await renderPdfPage(pdfPath, 1);

    await ensureDir(COVERS_PATH);
    const coverFilename = `${bookId}.${COVER_IMAGE_CONFIG.format}`;
    const coverPath = path.join(COVERS_PATH, coverFilename);

    await sharp(firstPageBuffer)
      .resize(COVER_IMAGE_CONFIG.width, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: COVER_IMAGE_CONFIG.quality })
      .toFile(coverPath);

    console.log(`✅ Обложка создана: ${coverPath}`);
    return `library/covers/${coverFilename}`;
  } catch (error) {
    console.error("❌ Ошибка создания обложки:", error);
    throw error;
  }
}

/**
 * Извлечь метаданные и количество страниц
 */
export async function getPDFInfo(pdfPath: string): Promise<{
  pageCount: number;
  metadata: PDFMetadata;
}> {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pageCount = pdfDoc.getPageCount();

    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();
    const creationDate = pdfDoc.getCreationDate();
    const modificationDate = pdfDoc.getModificationDate();

    return {
      pageCount,
      metadata: {
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        creator: creator || undefined,
        producer: producer || undefined,
        creationDate: creationDate || undefined,
        modificationDate: modificationDate || undefined,
      },
    };
  } catch (error) {
    console.error("❌ Ошибка анализа PDF:", error);
    throw error;
  }
}

/**
 * Получить количество страниц в PDF (legacy wrapper)
 */
export async function getPDFPageCount(pdfPath: string): Promise<number> {
  const info = await getPDFInfo(pdfPath);
  return info.pageCount;
}

/**
 * Удалить файлы книги
 */
export async function deleteBookFiles(bookId: string): Promise<void> {
  try {
    // Удаляем кэш страниц
    const cacheDir = path.join(CACHE_PATH, bookId);
    await fs.rm(cacheDir, { recursive: true, force: true });

    // Удаляем обложку
    const coverPath = path.join(COVERS_PATH, `${bookId}.webp`);
    await fs.rm(coverPath, { force: true });

    console.log(`✅ Файлы кэша и обложки книги ${bookId} удалены`);
  } catch (error) {
    console.error("❌ Ошибка удаления файлов книги:", error);
  }
}
