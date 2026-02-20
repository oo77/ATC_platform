/**
 * PDF Converter - Утилита для AI-анализа PDF
 *
 * - extractText: извлечение текста через pdfjs-dist (без Puppeteer)
 * - convertFirstPageToImage: рендеринг первой страницы через pdfjs-dist + @napi-rs/canvas
 * - getPageCount: подсчёт страниц через pdf-lib
 */

import fs from "fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";

// ============================================================
// Инициализация pdfjs-dist для Node.js
// ============================================================
if (typeof (globalThis as any).DOMMatrix === "undefined") {
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
// КОНФИГУРАЦИЯ
// ============================================================

const IMAGE_CONFIG = {
  width: 1600,
  scale: 2.0,
};

// ============================================================
// УТИЛИТА
// ============================================================

export const pdfConverter = {
  /**
   * Извлекает текст из PDF через pdfjs-dist (чистый JS, без Puppeteer)
   */
  async extractText(filePath: string): Promise<string> {
    try {
      const pdfjs = await getPdfJs();
      const pdfBytes = await fs.readFile(filePath);

      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(pdfBytes),
        useSystemFonts: true,
      });

      const doc = await loadingTask.promise;
      const numPages = doc.numPages;
      let fullText = "";

      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }

      await doc.destroy();
      return fullText.trim();
    } catch (error) {
      console.error("[AI PDF] Text extraction failed:", error);
      return "";
    }
  },

  /**
   * Конвертирует первую страницу PDF в изображение для Vision API
   * Использует pdfjs-dist + @napi-rs/canvas (без Puppeteer)
   */
  async convertFirstPageToImage(filePath: string): Promise<Buffer> {
    const pdfjs = await getPdfJs();
    const pdfBytes = await fs.readFile(filePath);

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBytes),
      useSystemFonts: true,
    });

    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);

    // Масштаб под нужную ширину
    const naturalViewport = page.getViewport({ scale: 1.0 });
    const scale = IMAGE_CONFIG.width / naturalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx as any, viewport }).promise;
    await doc.destroy();

    // Возвращаем JPEG для Vision API (меньше размер)
    return canvas.toBuffer("image/jpeg", 90);
  },

  /**
   * Получает количество страниц через pdf-lib (чистый JS)
   */
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
