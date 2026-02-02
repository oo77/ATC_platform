import { defineEventHandler, readMultipartFormData, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { roleHasPermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { getDbPool } from "../../../../utils/db";
import * as pdfProcessor from "../../../../utils/pdfProcessor";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const db = getDbPool();

/**
 * POST /api/library/admin/books
 * Загрузка новой книги администратором
 *
 * Требуемые права: library.upload
 *
 * Body (multipart/form-data):
 * - file: PDF файл книги
 * - title: Название книги
 * - author?: Автор
 * - description?: Описание
 * - isbn?: ISBN
 * - publisher?: Издательство
 * - publishedYear?: Год издания
 * - language?: Язык (по умолчанию 'ru')
 * - category?: Категория
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_UPLOAD)) {
    console.error(
      `[Library] Unauthorized upload attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для загрузки книг",
    });
  }

  console.log(
    `[Library] Book upload started by user ${user.id} (${user.username})`,
  );

  try {
    // Парсинг multipart данных
    const formData = await readMultipartFormData(event);
    if (!formData) {
      throw createError({
        statusCode: 400,
        message: "Не удалось прочитать данные формы",
      });
    }

    // Извлечение файла и метаданных
    let pdfFile: { filename: string; data: Buffer } | null = null;
    const metadata: Record<string, string> = {};

    for (const part of formData) {
      if (part.name === "file" && part.filename) {
        pdfFile = {
          filename: part.filename,
          data: Buffer.from(part.data),
        };
      } else if (part.name && part.data && !part.filename) {
        metadata[part.name] = Buffer.from(part.data).toString("utf-8");
      }
    }

    // Валидация обязательных полей
    if (!pdfFile) {
      throw createError({
        statusCode: 400,
        message: "PDF файл не предоставлен",
      });
    }

    if (!metadata.title) {
      throw createError({
        statusCode: 400,
        message: "Название книги обязательно",
      });
    }

    // Проверка формата файла
    if (!pdfFile.filename.toLowerCase().endsWith(".pdf")) {
      throw createError({
        statusCode: 400,
        message: "Допустимы только PDF файлы",
      });
    }

    console.log(
      `[Library] Processing PDF: ${pdfFile.filename} (${(pdfFile.data.length / 1024 / 1024).toFixed(2)} MB)`,
    );

    // Генерация уникального имени файла
    const uniqueFilename = `${uuidv4()}.pdf`;
    const originalPath = join(
      process.cwd(),
      "storage",
      "library",
      "originals",
      uniqueFilename,
    );

    // Создание директории если не существует
    await mkdir(join(process.cwd(), "storage", "library", "originals"), {
      recursive: true,
    });

    // Сохранение оригинального PDF
    await writeFile(originalPath, pdfFile.data);
    console.log(`[Library] Original PDF saved: ${originalPath}`);

    // Извлечение количества страниц
    let pageCount = 0;
    try {
      pageCount = await pdfProcessor.getPDFPageCount(originalPath);
      console.log(`[Library] PDF page count: ${pageCount} pages`);
    } catch (error) {
      console.error(`[Library] Failed to extract PDF page count:`, error);
      throw createError({
        statusCode: 400,
        message: "Не удалось обработать PDF файл. Возможно, файл поврежден.",
      });
    }

    // Создание записи книги в БД
    const bookData: libraryRepository.CreateBookData = {
      title: metadata.title,
      author: metadata.author || undefined,
      description: metadata.description || undefined,
      isbn: metadata.isbn || undefined,
      category: metadata.category || undefined,
      total_pages: pageCount,
      original_file_path: originalPath,
      file_size_bytes: pdfFile.data.length,
      uploaded_by: user.id,
      cover_path: undefined,
    };

    const bookId = await libraryRepository.createBook(bookData);
    console.log(`[Library] Book created in DB: ID ${bookId}`);

    // Генерация обложки и завершение обработки
    try {
      const coverPath = await pdfProcessor.generateCover(bookId, originalPath);

      await db.execute(
        "UPDATE books SET cover_path = ?, status = ?, updated_at = NOW() WHERE id = ?",
        [coverPath, "ready", bookId],
      );

      console.log(
        `[Library] Book fully processed: ID ${bookId}, Cover: ${coverPath}`,
      );
    } catch (error) {
      console.error(
        `[Library] Warning: Failed to generate cover for book ${bookId}:`,
        error,
      );
      // Даже если обложка не создалась, книга доступна для чтения (без обложки)
      await db.execute(
        "UPDATE books SET status = ?, updated_at = NOW() WHERE id = ?",
        ["ready", bookId],
      );
    }

    console.log(
      `[Library] Book upload completed: ID ${bookId}, Title: "${bookData.title}"`,
    );

    return {
      success: true,
      book: {
        id: bookId,
        title: bookData.title,
        author: bookData.author,
        pageCount: bookData.total_pages,
        processingStatus: "ready",
      },
    };
  } catch (error) {
    console.error(`[Library] Book upload failed:`, error);
    throw error;
  }
});
