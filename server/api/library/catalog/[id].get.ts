import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import * as libraryRepository from "../../../repositories/libraryRepository";
import { requireBookAccess } from "../../../utils/libraryAccess";

/**
 * GET /api/library/catalog/[id]
 * Карточка книги для читателя: описание, личный прогресс и статистика чтения.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({ statusCode: 400, message: "Некорректный ID книги" });
  }

  await requireBookAccess(user, bookId);

  const book = await libraryRepository.getBookById(bookId);
  if (!book || book.status !== "ready") {
    throw createError({ statusCode: 404, message: "Книга недоступна" });
  }

  const [progress] = await executeQuery<any[]>(
    "SELECT * FROM book_reading_progress WHERE book_id = ? AND user_id = ? LIMIT 1",
    [bookId, user.id],
  );
  const [stats] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS total_sessions, MAX(started_at) AS last_session_at
     FROM book_reading_sessions WHERE book_id = ? AND user_id = ?`,
    [bookId, user.id],
  );

  const last = progress?.last_page || 0;
  const max = Math.max(progress?.max_page || 0, last);
  return {
    success: true,
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      isbn: book.isbn,
      language: book.language,
      category: book.category,
      publishedYear: book.published_year,
      pageCount: book.total_pages,
      coverUrl: book.cover_path ? `/api/library/covers/${book.id}` : null,
      readingProgress: {
        lastPageRead: last,
        maxPageRead: max,
        progressPercent: book.total_pages > 0 ? Math.round((max / book.total_pages) * 100) : 0,
        lastReadAt: progress?.last_read_at || null,
        isCompleted: !!progress?.completed_at || (book.total_pages > 0 && max >= book.total_pages),
      },
      statistics: {
        totalSessions: Number(stats?.total_sessions || 0),
        totalTimeSeconds: Number(progress?.total_seconds || 0),
        lastSessionAt: stats?.last_session_at || null,
      },
    },
  };
});
