import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs/promises';
import path__default from 'path';

const STORAGE_PATH = path__default.join(process.cwd(), "storage", "library");
path__default.join(STORAGE_PATH, "originals");
const CACHE_PATH = path__default.join(STORAGE_PATH, "cache");
const COVERS_PATH = path__default.join(STORAGE_PATH, "covers");
const PAGE_IMAGE_CONFIG = {
  width: 1200,
  // Ширина страницы в пикселях
  quality: 85,
  // Качество WebP
  format: "webp"
};
const COVER_IMAGE_CONFIG = {
  width: 400,
  // Ширина обложки
  quality: 90,
  format: "webp"
};
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
async function getPageImage(bookId, pageNumber, pdfPath) {
  const cacheDir = path__default.join(CACHE_PATH, bookId);
  const cacheFile = path__default.join(
    cacheDir,
    `page_${String(pageNumber).padStart(3, "0")}.${PAGE_IMAGE_CONFIG.format}`
  );
  try {
    const cachedImage = await fs.readFile(cacheFile);
    return cachedImage;
  } catch {
  }
  if (!pdfPath) {
    throw new Error("PDF path is required for generation");
  }
  console.log(
    `[PDF] Cache miss. Generating page ${pageNumber} for book ${bookId}`
  );
  const imageBuffer = await renderPdfPage(pdfPath, pageNumber);
  await ensureDir(cacheDir);
  await fs.writeFile(cacheFile, imageBuffer);
  return imageBuffer;
}
let browserInstance = null;
let browserCloseTimeout = null;
async function getBrowser() {
  if (browserCloseTimeout) {
    clearTimeout(browserCloseTimeout);
    browserCloseTimeout = null;
  }
  if (!browserInstance) {
    const puppeteer = await import('puppeteer');
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
      // Оптимизация памяти
    });
    console.log("[PDF] Started new Puppeteer browser instance");
  }
  browserCloseTimeout = setTimeout(async () => {
    if (browserInstance) {
      console.log("[PDF] Closing idle Puppeteer browser instance");
      await browserInstance.close();
      browserInstance = null;
    }
  }, 12e4);
  return browserInstance;
}
async function renderPdfPage(pdfPath, pageNumber) {
  const browser = await getBrowser();
  let page = null;
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfBase64 = pdfBytes.toString("base64");
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        <\/script>
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
      { waitUntil: "domcontentloaded" }
    );
    await page.evaluate(
      async (pdfData, num) => {
        const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
        const pdfDoc = await loadingTask.promise;
        if (num > pdfDoc.numPages || num < 1) {
          throw new Error("Page number out of range");
        }
        const pdfPage = await pdfDoc.getPage(num);
        const viewport = pdfPage.getViewport({ scale: 2 });
        const canvas = document.getElementById("the-canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await pdfPage.render({
          canvasContext: context,
          viewport
        }).promise;
      },
      pdfBase64,
      pageNumber
    );
    const canvasElement = await page.$("#the-canvas");
    if (!canvasElement) {
      throw new Error("Canvas element not found");
    }
    const screenshot = await canvasElement.screenshot({ type: "png" });
    const outputBuffer = await sharp(screenshot).webp({ quality: PAGE_IMAGE_CONFIG.quality }).toBuffer();
    return outputBuffer;
  } catch (error) {
    console.error(`[PDF] Error rendering page ${pageNumber}:`, error);
    throw error;
  } finally {
    if (page) {
      await page.close();
    }
  }
}
async function generateCover(bookId, pdfPath) {
  try {
    const firstPageBuffer = await renderPdfPage(pdfPath, 1);
    await ensureDir(COVERS_PATH);
    const coverFilename = `${bookId}.${COVER_IMAGE_CONFIG.format}`;
    const coverPath = path__default.join(COVERS_PATH, coverFilename);
    await sharp(firstPageBuffer).resize(COVER_IMAGE_CONFIG.width, null, {
      fit: "inside",
      withoutEnlargement: true
    }).webp({ quality: COVER_IMAGE_CONFIG.quality }).toFile(coverPath);
    console.log(`\u2705 \u041E\u0431\u043B\u043E\u0436\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430: ${coverPath}`);
    return `library/covers/${coverFilename}`;
  } catch (error) {
    console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0438:", error);
    throw error;
  }
}
async function getPDFInfo(pdfPath) {
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
        title: title || void 0,
        author: author || void 0,
        subject: subject || void 0,
        creator: creator || void 0,
        producer: producer || void 0,
        creationDate: creationDate || void 0,
        modificationDate: modificationDate || void 0
      }
    };
  } catch (error) {
    console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 PDF:", error);
    throw error;
  }
}
async function getPDFPageCount(pdfPath) {
  const info = await getPDFInfo(pdfPath);
  return info.pageCount;
}
async function deleteBookFiles(bookId) {
  try {
    const cacheDir = path__default.join(CACHE_PATH, bookId);
    await fs.rm(cacheDir, { recursive: true, force: true });
    const coverPath = path__default.join(COVERS_PATH, `${bookId}.webp`);
    await fs.rm(coverPath, { force: true });
    console.log(`\u2705 \u0424\u0430\u0439\u043B\u044B \u043A\u044D\u0448\u0430 \u0438 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u043A\u043D\u0438\u0433\u0438 ${bookId} \u0443\u0434\u0430\u043B\u0435\u043D\u044B`);
  } catch (error) {
    console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u043E\u0432 \u043A\u043D\u0438\u0433\u0438:", error);
  }
}

export { generateCover as a, getPDFPageCount as b, getPageImage as c, deleteBookFiles as d, getPDFInfo as g };
//# sourceMappingURL=pdfProcessor.mjs.map
