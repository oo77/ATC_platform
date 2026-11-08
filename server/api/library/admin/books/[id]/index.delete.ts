import { defineEventHandler, createError } from "h3";
import { unlink } from "fs/promises";
import { requireAuth } from "../../../../../utils/auth";
import { executeQuery } from "../../../../../utils/db";
import * as libraryRepository from "../../../../../repositories/libraryRepository";
import * as pdfProcessor from "../../../../../utils/pdfProcessor";
import { logActivity } from "../../../../../utils/activityLogger";
import { requireLibraryPermission } from "../../../../../utils/libraryAccess";

/**
 * DELETE /api/library/admin/books/[id]
 * Удаление книги: запись помечается удалённой (история чтения сохраняется
 * для аналитики), доступы снимаются, открытые сессии закрываются, файлы удаляются.
 *
 * Раньше удаление блокировалось «активными» сессиями, которые после закрытия
 * вкладки не завершались никогда, — книгу нельзя было удалить.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user);

  const bookId = event.context.params?.id;
  if (!bookId) throw createError({ statusCode: 400, message: "Некорректный ID книги" });

  const book = await libraryRepository.getBookById(bookId);
  if (!book) throw createError({ statusCode: 404, message: "Книга не найдена" });

  await executeQuery(
    "UPDATE book_reading_sessions SET ended_at = NOW() WHERE book_id = ? AND ended_at IS NULL",
    [bookId],
  );
  await executeQuery("DELETE FROM book_access WHERE book_id = ?", [bookId]);
  await libraryRepository.deleteBook(bookId);

  await logActivity(event, "DELETE", "LIBRARY_BOOK", bookId, book.title, {
    action: "delete_book",
    author: book.author,
    pages: book.total_pages,
  });

  // Файлы удаляем после ответа: оригинал, обложку и кэш страниц
  setImmediate(async () => {
    try {
      if (book.original_file_path) await unlink(book.original_file_path).catch(() => {});
      await pdfProcessor.deleteBookFiles(bookId);
    } catch (error) {
      console.error(`[Library] File cleanup failed for book ${bookId}:`, error);
    }
  });

  return {
    success: true,
    message: "Книга удалена",
    deletedBook: { id: book.id, title: book.title, author: book.author },
  };
});
