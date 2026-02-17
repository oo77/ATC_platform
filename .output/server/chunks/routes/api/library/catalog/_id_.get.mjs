import { g as defineEventHandler, G as requireAuth, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
import { c as checkUserBookAccess, g as getBookById } from '../../../../_/libraryRepository.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const _id__get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  console.log(
    `[Library] Book details requested: ID ${bookId} by user ${user.id} (${user.username})`
  );
  try {
    const hasAccess = await checkUserBookAccess(
      user.id,
      String(bookId)
    );
    if (!hasAccess) {
      console.warn(
        `[Library] Access denied for user ${user.id} to book ${bookId}`
      );
      throw createError({
        statusCode: 403,
        message: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u044D\u0442\u043E\u0439 \u043A\u043D\u0438\u0433\u0435"
      });
    }
    const book = await getBookById(String(bookId));
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (book.status !== "ready") {
      console.warn(
        `[Library] Book ${bookId} is not ready for reading: status ${book.status}`
      );
      throw createError({
        statusCode: 409,
        message: book.status === "processing" ? "\u041A\u043D\u0438\u0433\u0430 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442\u0441\u044F. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u0434\u043E\u0436\u0434\u0438\u0442\u0435." : "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F \u0438\u0437-\u0437\u0430 \u043E\u0448\u0438\u0431\u043A\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438."
      });
    }
    const progressResult = await executeQuery(
      "SELECT * FROM book_reading_progress WHERE book_id = ? AND user_id = ? LIMIT 1",
      [bookId, user.id]
    );
    const progress = progressResult[0] || null;
    const accessInfoResult = await executeQuery(
      "SELECT granted_at, expires_at FROM book_access WHERE book_id = ? AND user_id = ? LIMIT 1",
      [bookId, user.id]
    );
    const accessInfo = accessInfoResult[0] || null;
    const lastSessionResult = await executeQuery(
      "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? ORDER BY started_at DESC LIMIT 1",
      [bookId, user.id]
    );
    const lastSession = lastSessionResult[0] || null;
    const statsResult = await executeQuery(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN ended_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, ended_at) ELSE 0 END) as total_time
      FROM book_reading_sessions 
      WHERE book_id = ? AND user_id = ?`,
      [bookId, user.id]
    );
    const stats = statsResult[0] || null;
    console.log(
      `[Library] Book ${bookId} details loaded for user ${user.id}. Progress: ${progress?.last_page_read || 0}/${book.total_pages}`
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
          isExpiringSoon: accessInfo?.expires_at ? new Date(accessInfo.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1e3 : false
        },
        readingProgress: {
          lastPageRead: progress?.last_page_read || 0,
          progressPercent: book.total_pages > 0 ? Math.round(
            (progress?.last_page_read || 0) / book.total_pages * 100
          ) : 0,
          lastReadAt: progress?.updated_at,
          isCompleted: (progress?.last_page_read || 0) >= book.total_pages
        },
        statistics: {
          totalSessions: stats?.total_sessions || 0,
          totalTimeSeconds: stats?.total_time || 0,
          lastSessionAt: lastSession?.started_at
        }
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to fetch book details ${bookId} for user ${user.id}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043E \u043A\u043D\u0438\u0433\u0435"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
