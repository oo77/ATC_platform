import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { roleHasPermission } from "../../../../../utils/permissions";
import { Permission } from "../../../../../types/permissions";
import * as libraryRepository from "../../../../../repositories/libraryRepository";
import * as pdfProcessor from "../../../../../utils/pdfProcessor";
import { getDbPool } from "../../../../../utils/db";
import { RowDataPacket } from "mysql2";

const db = getDbPool();

/**
 * POST /api/library/admin/books/[id]/reprocess
 * Переобработка PDF книги
 *
 * Требуемые права: library.manage
 *
 * Используется когда:
 * - Обработка завершилась с ошибкой
 * - Нужно обновить изображения страниц
 * - Изменились настройки обработки
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized reprocess attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для переобработки книг",
    });
  }

  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  console.log(
    `[Library] Book reprocess requested: ID ${bookId} by user ${user.id} (${user.username})`,
  );

  try {
    // Получение книги
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found for reprocessing: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Проверка наличия оригинального файла
    const { existsSync } = await import("fs");
    if (!existsSync(book.original_file_path)) {
      console.error(
        `[Library] Original PDF not found for book ${bookId}: ${book.original_file_path}`,
      );
      throw createError({
        statusCode: 404,
        message: "Оригинальный PDF файл не найден",
      });
    }

    // Проверка активных сессий чтения
    const [sessions] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM book_reading_sessions 
       WHERE book_id = ? AND ended_at IS NULL`,
      [bookId],
    );
    const activeSessions = sessions[0];

    // Завершение всех активных сессий чтения для этой книги
    if (activeSessions && Number(activeSessions.count) > 0) {
      console.log(
        `[Library] Closing ${activeSessions.count} active sessions for book ${bookId} before reprocessing`,
      );
      await db.execute(
        "UPDATE book_reading_sessions SET ended_at = NOW() WHERE book_id = ? AND ended_at IS NULL",
        [bookId],
      );
    }

    // Обновление статуса на "обработка"
    await db.execute(
      "UPDATE books SET status = ?, processing_error = NULL WHERE id = ?",
      ["processing", bookId],
    );

    console.log(
      `[Library] Starting reprocessing (cache clear + metadata update) for book ${bookId}: "${book.title}"`,
    );

    // Удаление кэша и старых обложек
    await pdfProcessor.deleteBookFiles(bookId);

    // Очистка старых записей страниц из БД (они больше не нужны, так как страницы не хранятся в БД)
    // Но если у нас остались записи в book_pages, их лучше удалить, чтобы не мусорить.
    // В новой схеме мы не используем book_pages для хранения путей к файлам (они генерируются).
    // Но API чтения может (в старой версии) смотреть в book_pages.
    // В новой версии API чтения мы переделали на on-demand и не смотрим в book_pages для путей,
    // но репозиторий может их использовать.
    // Давайте почистим таблицу book_pages полностью для этой книги.
    await db.execute("DELETE FROM book_pages WHERE book_id = ?", [bookId]);

    // Переобработка в фоне
    setImmediate(async () => {
      try {
        // Извлечение метаданных и количества страниц
        const pdfInfo = await pdfProcessor.getPDFInfo(book.original_file_path);

        console.log(`[Library] PDF analyzed. Pages: ${pdfInfo.pageCount}`);

        // Обновление количества страниц
        if (pdfInfo.pageCount !== book.total_pages) {
          await db.execute("UPDATE books SET total_pages = ? WHERE id = ?", [
            pdfInfo.pageCount,
            bookId,
          ]);
        }

        // Генерация новой обложки
        const coverPath = await pdfProcessor.generateCover(
          bookId,
          book.original_file_path,
        );

        await db.execute("UPDATE books SET cover_path = ? WHERE id = ?", [
          coverPath,
          bookId,
        ]);

        console.log(`[Library] New cover generated: ${coverPath}`);

        // Обновление статуса на "завершено"
        await db.execute(
          "UPDATE books SET status = ?, updated_at = NOW() WHERE id = ?",
          ["ready", bookId],
        );

        console.log(
          `[Library] Book ${bookId} reprocessing completed successfully`,
        );
      } catch (error) {
        console.error(`[Library] Error reprocessing book ${bookId}:`, error);

        // Обновление статуса на ошибку
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await db.execute(
          "UPDATE books SET status = ?, processing_error = ? WHERE id = ?",
          ["error", errorMessage, bookId],
        );
      }
    });

    console.log(
      `[Library] Reprocessing initiated for book ${bookId} by user ${user.id}`,
    );

    return {
      success: true,
      message: "Переобработка книги начата (кэш очищен, обложка обновляется)",
      book: {
        id: bookId,
        title: book.title,
        processingStatus: "processing",
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to initiate reprocessing for book ${bookId}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при переобработке книги",
    });
  }
});
