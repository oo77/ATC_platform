/**
 * PDF Processor - Обработка PDF файлов
 *
 * Архитектура:
 * - Метаданные / кол-во страниц → pdf-lib (чистый JS, без воркеров)
 * - Обложка → pdf-lib (извлечение первой страницы → отдача как PDF для клиентского рендеринга)
 * - Рендеринг страниц (чтение) → нативный браузерный PDF-просмотр (object/embed)
 *
 * Тяжёлые зависимости (@napi-rs/canvas, pdfjs-dist) полностью убраны.
 * Единственная серверная зависимость для PDF — pdf-lib (чистый JS, ~250KB).
 */

import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

// ============================================================
// КОНСТАНТЫ
// ============================================================

const STORAGE_PATH = path.join(process.cwd(), "storage", "library");
const CACHE_PATH = path.join(STORAGE_PATH, "cache");
const COVERS_PATH = path.join(STORAGE_PATH, "covers");

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
 * Извлечь метаданные и количество страниц (через pdf-lib — чистый JS).
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
 * Получить количество страниц (legacy wrapper).
 */
export async function getPDFPageCount(pdfPath: string): Promise<number> {
  const info = await getPDFInfo(pdfPath);
  return info.pageCount;
}

/**
 * Генерировать обложку книги — извлекаем первую страницу из PDF
 * и сохраняем как отдельный PDF-файл.
 *
 * Клиент потом рендерит эту обложку через нативный браузерный просмотр.
 * Никаких тяжёлых серверных зависимостей.
 */
export async function generateCover(
  bookId: string,
  pdfPath: string,
): Promise<string> {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    if (srcDoc.getPageCount() === 0) {
      throw new Error("PDF файл не содержит страниц");
    }

    // Создаём новый PDF с единственной (первой) страницей
    const coverDoc = await PDFDocument.create();
    const [firstPage] = await coverDoc.copyPages(srcDoc, [0]);
    coverDoc.addPage(firstPage);

    const coverPdfBytes = await coverDoc.save();

    await ensureDir(COVERS_PATH);

    // Сохраняем как PDF (а не PNG/WebP — не требует canvas-библиотек)
    const coverFilename = `${bookId}.pdf`;
    const coverPath = path.join(COVERS_PATH, coverFilename);
    await fs.writeFile(coverPath, coverPdfBytes);

    console.log(`✅ Обложка (первая страница PDF) создана: ${coverPath}`);
    return `library/covers/${coverFilename}`;
  } catch (error) {
    console.error(`❌ Ошибка генерации обложки для книги ${bookId}:`, error);
    // Возвращаем пустую строку — книга будет отображаться без обложки
    return "";
  }
}

/**
 * Получить изображение страницы из кэша.
 *
 * @deprecated Серверный рендеринг страниц полностью удалён.
 * Используйте нативный PDF-просмотр в браузере через /api/library/reading/[bookId]/raw
 */
export async function getPageImage(
  bookId: string,
  pageNumber: number,
  _pdfPath?: string,
): Promise<Buffer> {
  // Проверяем кэш (может существовать от старой версии)
  const cacheDir = path.join(CACHE_PATH, bookId);
  const cacheFile = path.join(
    cacheDir,
    `page_${String(pageNumber).padStart(3, "0")}.png`,
  );

  try {
    return await fs.readFile(cacheFile);
  } catch {
    throw new Error(
      "Серверный рендеринг страниц отключён. Используйте endpoint /raw для браузерного просмотра PDF.",
    );
  }
}

/**
 * Удалить файлы кэша и обложки книги.
 */
export async function deleteBookFiles(bookId: string): Promise<void> {
  try {
    const cacheDir = path.join(CACHE_PATH, bookId);
    await fs.rm(cacheDir, { recursive: true, force: true });

    // Удаляем все варианты обложек (pdf, png, webp — от разных версий)
    for (const ext of ["pdf", "png", "webp"]) {
      const coverPath = path.join(COVERS_PATH, `${bookId}.${ext}`);
      await fs.rm(coverPath, { force: true });
    }

    console.log(`✅ Файлы кэша и обложки книги ${bookId} удалены`);
  } catch (error) {
    console.error("❌ Ошибка удаления файлов книги:", error);
  }
}
