import fs from "fs/promises";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

// ========================================
// КОНФИГУРАЦИЯ
// ========================================

const IMAGE_CONFIG = {
  width: 1600, // Высокое разрешение для OCR
  quality: 85,
  format: "jpeg" as const, // Vision API хорошо работает с JPEG
};

// ========================================
// SINGLETON PUPPETEER
// ========================================
// Используем локальный экземпляр браузера, чтобы не конфликтовать с библиотечным процессором
// и иметь независимое управление памятью.

let browserInstance: any = null;
let browserCloseTimeout: NodeJS.Timeout | null = null;

async function getBrowser() {
  if (browserCloseTimeout) {
    clearTimeout(browserCloseTimeout);
    browserCloseTimeout = null;
  }

  if (!browserInstance) {
    // Динамический импорт для предотвращения проблем при сборке, если пакет отсутствует
    const puppeteer = await import("puppeteer");
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Важно для Docker/Serverless
        "--font-render-hinting=none", // Улучшает четкость текста
      ],
    });
  }

  // Авто-закрытие через 60 секунд простоя для экономии ресурсов
  browserCloseTimeout = setTimeout(async () => {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
  }, 60000);

  return browserInstance;
}

/**
 * Утилита для конвертации PDF для AI-анализа
 */
export const pdfConverter = {
  /**
   * Извлекает текст из PDF
   * Использует Puppeteer + PDF.js для надежного извлечения текста
   * Взамен проблемного pdf-parse
   */
  async extractText(filePath: string): Promise<string> {
    const browser = await getBrowser();
    let page = null;

    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfBase64 = pdfBytes.toString("base64");

      page = await browser.newPage();

      // Загружаем минимальный HTML с PDF.js из CDN
      // Это позволяет парсить PDF в "браузерном" контексте, что очень надежно
      await page.setContent(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <script>
            // Настройка воркера обязательна
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          </script>
        </head>
        <body></body>
        </html>
      `,
        { waitUntil: "domcontentloaded" },
      );

      // Выполняем скрипт извлечения текста внутри страницы
      const text = await page.evaluate(async (pdfData: string) => {
        try {
          // @ts-ignore
          const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
          // @ts-ignore
          const pdfDoc = await loadingTask.promise;
          const numPages = pdfDoc.numPages;
          let fullText = "";

          for (let i = 1; i <= numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();

            // Собираем текст со страницы
            // item.str содержит текст, item.hasEOL говорит о переносе строки, но часто лучше просто пробел
            // transform может помочь с позиционированием, но для простого текста достаточно порядка
            const pageStrings = textContent.items.map((item: any) => item.str);

            fullText += pageStrings.join(" ") + "\n\n";
          }

          return fullText;
        } catch (e: any) {
          return "Error inside page evaluate: " + e.toString();
        }
      }, pdfBase64);

      return text.trim();
    } catch (error) {
      console.error("[AI PDF] Text extraction failed:", error);
      // Возвращаем пустую строку вместо ошибки, чтобы процесс мог продолжиться (например, только с Vision API)
      return "";
    } finally {
      if (page) await page.close();
    }
  },

  /**
   * Конвертирует первую страницу PDF в изображение для Vision API
   */
  async convertFirstPageToImage(filePath: string): Promise<Buffer> {
    const browser = await getBrowser();
    let page = null;

    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfBase64 = pdfBytes.toString("base64");

      page = await browser.newPage();

      // Настройка области просмотра
      await page.setViewport({ width: IMAGE_CONFIG.width, height: 1200 });

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
      );

      // Рендерим первую страницу
      await page.evaluate(async (pdfData: string) => {
        // @ts-ignore
        const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
        // @ts-ignore
        const pdfDoc = await loadingTask.promise;
        const pdfPage = await pdfDoc.getPage(1); // Всегда первая страница для сертификата

        const viewport = pdfPage.getViewport({ scale: 2.0 }); // Scale 2.0 для хорошего качества текста

        // @ts-ignore
        const canvas = document.getElementById("the-canvas");
        // @ts-ignore
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await pdfPage.render({
          canvasContext: context,
          viewport: viewport,
          enableWebHost: false,
        }).promise;
      }, pdfBase64);

      // @ts-ignore
      const canvasElement = await page.$("#the-canvas");
      if (!canvasElement) {
        throw new Error("Canvas rendering failed");
      }

      // Снимаем скриншот
      const screenshot = await canvasElement.screenshot({
        type: "jpeg",
        quality: 90,
      });

      // Оптимизируем через sharp (уменьшаем размер файла при сохранении читаемости)
      const optimizedBuffer = await sharp(screenshot)
        .resize(IMAGE_CONFIG.width, null, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: IMAGE_CONFIG.quality })
        .toBuffer();

      return optimizedBuffer;
    } catch (error) {
      console.error("[AI PDF] Image conversion failed:", error);
      throw new Error(
        `Failed to convert PDF to image: ${(error as Error).message}`,
      );
    } finally {
      if (page) await page.close();
    }
  },

  /**
   * Получает количество страниц
   */
  async getPageCount(filePath: string): Promise<number> {
    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      return pdfDoc.getPageCount();
    } catch {
      return 1; // Default fallback
    }
  },
};
