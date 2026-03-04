/**
 * PDF Converter - Утилита для AI-анализа PDF
 *
 * Переработанная версия:
 * - Убрана зависимость от @napi-rs/canvas.
 * - Извлечение текста выполняется через pdfjs-dist в текстовом режиме.
 * - Извлечение метаданных и страниц через pdf-lib (чистый JS).
 */

import fs from "fs/promises";
import { PDFDocument } from "pdf-lib";

// Динамический импорт pdfjs-dist для сервера
let pdfjsLib: any = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjsLib;
}

export const pdfConverter = {
  /**
   * Извлекает текстовое содержимое из PDF для AI.
   * Не требует canvas!
   */
  async extractText(filePath: string): Promise<string> {
    try {
      const data = await fs.readFile(filePath);
      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(data),
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      let fullText = "";

      // Проходим по первым 3 страницам (обычно этого достаточно для сертификата)
      const numPages = Math.min(pdf.numPages, 3);
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      // Добавляем метаданные из pdf-lib
      const pdfLibBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfLibBytes, {
        ignoreEncryption: true,
      });
      const metadata = `
Название: ${pdfDoc.getTitle() || "Нет"}
Автор: ${pdfDoc.getAuthor() || "Нет"}
Тема: ${pdfDoc.getSubject() || "Нет"}
Страниц: ${pdfDoc.getPageCount()}
---
`;

      return (metadata + fullText).trim();
    } catch (error: any) {
      console.error("[AI PDF] Text extraction failed:", error);
      return "";
    }
  },

  /**
   * Извлекает первую страницу как Buffer (PDF).
   */
  async getFirstPageAsPdf(filePath: string): Promise<Buffer> {
    const pdfBytes = await fs.readFile(filePath);
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    if (srcDoc.getPageCount() === 0) throw new Error("PDF empty");

    const newDoc = await PDFDocument.create();
    const [firstPage] = await newDoc.copyPages(srcDoc, [0]);
    newDoc.addPage(firstPage);

    const pdfOutput = await newDoc.save();
    return Buffer.from(pdfOutput);
  },

  /**
   * Заглушка для обратной совместимости.
   * Т.к. мы отказались от тяжелых либ на сервере,
   * мы больше не конвертируем PDF в изображение на бэкенде.
   */
  async convertFirstPageToImage(_filePath: string): Promise<Buffer> {
    console.warn(
      "⚠️ convertFirstPageToImage is deprecated. Returning empty buffer.",
    );
    return Buffer.from("");
  },

  async getPageCount(filePath: string): Promise<number> {
    try {
      const pdfBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });
      return pdfDoc.getPageCount();
    } catch {
      return 1;
    }
  },
};
