import { g as defineEventHandler, G as requireAuth, h as createError, f as executeQuery, L as setResponseHeader } from '../../../../../../_/nitro.mjs';
import { c as checkUserBookAccess, g as getBookById, s as saveReadingProgress, h as updateSessionActivity } from '../../../../../../_/libraryRepository.mjs';
import { c as getPageImage } from '../../../../../../_/pdfProcessor.mjs';
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
import 'pdf-lib';
import 'sharp';
import 'fs/promises';
import 'path';

const _pageNumber__get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  const pageNumber = parseInt(event.context.params?.pageNumber || "0");
  if (!bookId || !pageNumber || pageNumber < 1) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B"
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
    const sessions = await executeQuery(
      `SELECT * FROM book_reading_sessions 
       WHERE book_id = ? 
         AND user_id = ? 
         AND ended_at IS NULL 
       ORDER BY started_at DESC LIMIT 1`,
      [bookId, user.id]
    );
    const activeSession = sessions[0];
    if (!activeSession) {
      throw createError({
        statusCode: 409,
        message: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u0447\u0442\u0435\u043D\u0438\u044F. \u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0447\u0442\u0435\u043D\u0438\u0435 \u0437\u0430\u043D\u043E\u0432\u043E."
      });
    }
    const book = await getBookById(bookId);
    if (!book) {
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (pageNumber > book.total_pages) {
      throw createError({
        statusCode: 404,
        message: "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const imageBuffer = await getPageImage(
      bookId,
      pageNumber,
      book.original_file_path
    );
    saveReadingProgress(String(user.id), bookId, pageNumber).catch((err) => {
      console.error(`[Library] Failed to update reading progress:`, err);
    });
    updateSessionActivity(activeSession.id, pageNumber).catch((err) => {
      console.error(`[Library] Failed to update session activity:`, err);
    });
    setResponseHeader(event, "Content-Type", "image/webp");
    setResponseHeader(
      event,
      "Cache-Control",
      "private, max-age=3600"
      // Кэшируем на час в браузере, так как страница статична
    );
    return imageBuffer;
  } catch (error) {
    console.error(
      `[Library] Failed to serve page ${pageNumber} of book ${bookId} to user ${user.id}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B"
    });
  }
});

export { _pageNumber__get as default };
//# sourceMappingURL=_pageNumber_.get.mjs.map
