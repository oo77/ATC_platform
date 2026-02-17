import { g as defineEventHandler, G as requireAuth, h as createError, r as readBody, f as executeQuery } from '../../../../../_/nitro.mjs';
import { c as checkUserBookAccess, g as getBookById, s as saveReadingProgress, h as updateSessionActivity } from '../../../../../_/libraryRepository.mjs';
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

const progress_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  const body = await readBody(event) || {};
  const lastPageRead = parseInt(body.lastPageRead);
  if (!lastPageRead || lastPageRead < 1) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B"
    });
  }
  try {
    const hasAccess = await checkUserBookAccess(
      String(user.id),
      bookId
    );
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        message: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u044D\u0442\u043E\u0439 \u043A\u043D\u0438\u0433\u0435"
      });
    }
    const book = await getBookById(bookId);
    if (!book) {
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (lastPageRead > book.total_pages) {
      throw createError({
        statusCode: 400,
        message: `\u041D\u043E\u043C\u0435\u0440 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0435\u0442 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0432 \u043A\u043D\u0438\u0433\u0435 (${book.total_pages})`
      });
    }
    const sessions = await executeQuery(
      `SELECT * FROM book_reading_sessions 
       WHERE book_id = ? 
         AND user_id = ? 
         AND ended_at IS NULL LIMIT 1`,
      [bookId, user.id]
    );
    const activeSession = sessions[0];
    if (!activeSession) {
      throw createError({
        statusCode: 409,
        message: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u0447\u0442\u0435\u043D\u0438\u044F"
      });
    }
    await saveReadingProgress(
      String(user.id),
      bookId,
      lastPageRead
    );
    await updateSessionActivity(
      activeSession.id,
      lastPageRead
    );
    const progressPercent = Math.round(lastPageRead / book.total_pages * 100);
    return {
      success: true,
      progress: {
        lastPageRead,
        totalPages: book.total_pages,
        progressPercent,
        isCompleted: lastPageRead >= book.total_pages
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to save progress for book ${bookId}, user ${user.id}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430"
    });
  }
});

export { progress_post as default };
//# sourceMappingURL=progress.post.mjs.map
