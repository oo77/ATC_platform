import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import * as libraryRepository from "../../../repositories/libraryRepository";

/**
 * GET /api/library/catalog/[id]
 * Получение детальной информации о книге для чтения
 *
 * Проверяет:
 * - Наличие доступа у пользователя
 * - Срок действия доступа
 * - Статус обработки книги
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  console.log(
    `[Library] Book details requested: ID ${bookId} by user ${user.id} (${user.username})`,
  );

  try {
    // Проверка доступа пользователя
    const hasAccess = await libraryRepository.checkUserBookAccess(
      user.id,
      String(bookId),
    );
    if (!hasAccess) {
      console.warn(
        `[Library] Access denied for user ${user.id} to book ${bookId}`,
      );
      throw createError({
        statusCode: 403,
        message: "У вас нет доступа к этой книге",
      });
    }

    // Получение книги
    const book = await libraryRepository.getBookById(String(bookId));
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Проверка статуса обработки
    if (book.status !== "ready") {
      console.warn(
        `[Library] Book ${bookId} is not ready for reading: status ${book.status}`,
      );
      throw createError({
        statusCode: 409,
        message:
          book.status === "processing"
            ? "Книга обрабатывается. Пожалуйста, подождите."
            : "Книга недоступна для чтения из-за ошибки обработки.",
      });
    }

    // Получение прогресса чтения
    const progressResult = await executeQuery<any[]>(
      "SELECT * FROM book_reading_progress WHERE book_id = ? AND user_id = ? LIMIT 1",
      [bookId, user.id],
    );
    const progress = progressResult[0] || null;

    // Получение информации о доступе
    const accessInfoResult = await executeQuery<any[]>(
      "SELECT granted_at, expires_at FROM book_access WHERE book_id = ? AND user_id = ? LIMIT 1",
      [bookId, user.id],
    );
    const accessInfo = accessInfoResult[0] || null;

    // Получение последней сессии чтения
    const lastSessionResult = await executeQuery<any[]>(
      "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? ORDER BY started_at DESC LIMIT 1",
      [bookId, user.id],
    );
    const lastSession = lastSessionResult[0] || null;

    // Получение общей статистики пользователя по этой книге
    const statsResult = await executeQuery<any[]>(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN ended_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, ended_at) ELSE 0 END) as total_time
      FROM book_reading_sessions 
      WHERE book_id = ? AND user_id = ?`,
      [bookId, user.id],
    );
    const stats = statsResult[0] || null;

    console.log(
      `[Library] Book ${bookId} details loaded for user ${user.id}. Progress: ${progress?.last_page_read || 0}/${book.total_pages}`,
    );

    return {
      success: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        // publisher: book.publisher,
        // publishedYear: book.published_year,
        // language: book.language,
        category: book.category,
        pageCount: book.total_pages,
        coverPath: book.cover_path,
        access: {
          grantedAt: accessInfo?.granted_at,
          expiresAt: accessInfo?.expires_at,
          isExpiringSoon: accessInfo?.expires_at
            ? new Date(accessInfo.expires_at).getTime() - Date.now() <
              7 * 24 * 60 * 60 * 1000 // 7 дней
            : false,
        },
        readingProgress: {
          lastPageRead: progress?.last_page_read || 0,
          progressPercent:
            book.total_pages > 0
              ? Math.round(
                  ((progress?.last_page_read || 0) / book.total_pages) * 100,
                )
              : 0,
          lastReadAt: progress?.updated_at,
          isCompleted: (progress?.last_page_read || 0) >= book.total_pages,
        },
        statistics: {
          totalSessions: stats?.total_sessions || 0,
          totalTimeSeconds: stats?.total_time || 0,
          lastSessionAt: lastSession?.started_at,
        },
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to fetch book details ${bookId} for user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении информации о книге",
    });
  }
});
