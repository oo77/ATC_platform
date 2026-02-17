import { g as defineEventHandler, G as requireAuth, h as createError } from '../../../../../_/nitro.mjs';
import { c as checkUserBookAccess, g as getBookById, i as getReadingProgress } from '../../../../../_/libraryRepository.mjs';
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

const progress_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
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
    const progress = await getReadingProgress(
      String(user.id),
      bookId
    );
    const lastPageRead = progress?.last_page || 0;
    const totalPages = book.total_pages;
    const progressPercent = totalPages > 0 ? Math.round(lastPageRead / totalPages * 100) : 0;
    return {
      success: true,
      progress: {
        lastPageRead,
        totalPages,
        progressPercent,
        isCompleted: lastPageRead >= totalPages,
        lastUpdated: progress?.last_read_at || null
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to fetch progress for book ${bookId}, user ${user.id}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430"
    });
  }
});

export { progress_get as default };
//# sourceMappingURL=progress.get.mjs.map
