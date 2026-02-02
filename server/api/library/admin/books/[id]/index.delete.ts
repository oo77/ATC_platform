import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { roleHasPermission } from "../../../../../utils/permissions";
import { Permission } from "../../../../../types/permissions";
import * as libraryRepository from "../../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../../utils/db";
import { unlink, rm } from "fs/promises";
import { RowDataPacket } from "mysql2";

const db = getDbPool();
import { join, dirname } from "path";
import { existsSync } from "fs";

/**
 * DELETE /api/library/admin/books/[id]
 * Удаление книги и всех связанных данных
 *
 * Требуемые права: library.delete
 *
 * Удаляет:
 * - Запись книги из БД
 * - Все страницы книги
 * - Все записи доступа
 * - Все сессии чтения
 * - Весь прогресс чтения
 * - Оригинальный PDF файл
 * - Все изображения страниц
 * - Обложку
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized book deletion attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для удаления книг",
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
    `[Library] Book deletion requested: ID ${bookId} by user ${user.id} (${user.username})`,
  );

  try {
    // Получение информации о книге
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found for deletion: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Проверка активных сессий чтения
    const [sessions] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM book_reading_sessions 
       WHERE book_id = ? AND ended_at IS NULL`,
      [bookId],
    );
    const activeSessions = sessions[0];

    if (activeSessions && parseInt(activeSessions.count as string) > 0) {
      console.warn(
        `[Library] Cannot delete book ${bookId}: ${activeSessions.count} active reading sessions`,
      );
      throw createError({
        statusCode: 409,
        message: `Невозможно удалить книгу: ${activeSessions.count} активных сессий чтения. Дождитесь их завершения.`,
      });
    }

    console.log(
      `[Library] Starting deletion process for book ${bookId}: "${book.title}"`,
    );

    // Получение всех страниц для удаления файлов
    const pages = await libraryRepository.getBookPages(bookId);
    console.log(
      `[Library] Found ${pages.length} pages to delete for book ${bookId}`,
    );

    // Удаление из БД (каскадное удаление настроено в миграции)
    await libraryRepository.deleteBook(bookId);
    console.log(`[Library] Book ${bookId} deleted from database`);

    // Удаление файлов (асинхронно, не блокируем ответ)
    setImmediate(async () => {
      const deletedFiles: string[] = [];
      const failedFiles: string[] = [];

      try {
        // Удаление оригинального PDF
        if (book.original_file_path && existsSync(book.original_file_path)) {
          try {
            await unlink(book.original_file_path);
            deletedFiles.push(book.original_file_path);
            console.log(
              `[Library] Deleted original PDF: ${book.original_file_path}`,
            );
          } catch (error) {
            failedFiles.push(book.original_file_path);
            console.error(
              `[Library] Failed to delete PDF ${book.original_file_path}:`,
              error,
            );
          }
        }

        // Удаление обложки
        if (book.cover_path && existsSync(book.cover_path)) {
          try {
            await unlink(book.cover_path);
            deletedFiles.push(book.cover_path);
            console.log(`[Library] Deleted cover: ${book.cover_path}`);
          } catch (error) {
            failedFiles.push(book.cover_path);
            console.error(
              `[Library] Failed to delete cover ${book.cover_path}:`,
              error,
            );
          }
        }

        // Удаление всех страниц
        for (const page of pages) {
          if (page.image_path && existsSync(page.image_path)) {
            try {
              await unlink(page.image_path);
              deletedFiles.push(page.image_path);
            } catch (error) {
              failedFiles.push(page.image_path);
              console.error(
                `[Library] Failed to delete page ${page.page_number}:`,
                error,
              );
            }
          }
        }

        console.log(
          `[Library] File cleanup completed for book ${bookId}: ${deletedFiles.length} deleted, ${failedFiles.length} failed`,
        );

        // Попытка удалить пустую директорию книги
        if (pages.length > 0 && pages[0].image_path) {
          const bookDir = dirname(pages[0].image_path);
          try {
            await rm(bookDir, { recursive: true, force: true });
            console.log(`[Library] Deleted book directory: ${bookDir}`);
          } catch (error) {
            console.warn(
              `[Library] Could not delete book directory ${bookDir}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error(
          `[Library] Error during file cleanup for book ${bookId}:`,
          error,
        );
      }
    });

    console.log(
      `[Library] Book ${bookId} ("${book.title}") successfully deleted by user ${user.id}`,
    );

    return {
      success: true,
      message: "Книга успешно удалена",
      deletedBook: {
        id: book.id,
        title: book.title,
        author: book.author,
      },
    };
  } catch (error: any) {
    console.error(`[Library] Failed to delete book ${bookId}:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при удалении книги",
    });
  }
});
