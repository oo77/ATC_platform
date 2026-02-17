import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../_/nitro.mjs';
import { c as checkUserBookAccess, g as getBookById, i as getReadingProgress, j as createReadingSession } from '../../../../../_/libraryRepository.mjs';
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

const db = getDbPool();
const start_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  console.log(
    `[Library] Reading session start requested for book ${bookId} by user ${user.id} (${user.username})`
  );
  try {
    const hasAccess = await checkUserBookAccess(
      user.id,
      bookId
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
    const book = await getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (book.status !== "ready") {
      console.warn(
        `[Library] Book ${bookId} is not ready: status ${book.status}`
      );
      throw createError({
        statusCode: 409,
        message: "\u041A\u043D\u0438\u0433\u0430 \u0435\u0449\u0435 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u0430 \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F"
      });
    }
    const [sessions] = await db.execute(
      "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
      [bookId, user.id]
    );
    const activeSession = sessions[0];
    const progress = await getReadingProgress(
      user.id,
      bookId
    );
    const lastPage = progress?.last_page || 1;
    if (activeSession) {
      console.log(
        `[Library] User ${user.id} already has active session ${activeSession.id} for book ${bookId}`
      );
      return {
        sessionId: activeSession.id,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          total_pages: book.total_pages
        },
        lastPage
      };
    }
    const sessionResult = await createReadingSession({
      book_id: bookId,
      user_id: user.id
    });
    console.log(
      `[Library] New reading session ${sessionResult.id} started for user ${user.id}, book ${bookId}`
    );
    return {
      sessionId: sessionResult.id,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        total_pages: book.total_pages
      },
      lastPage
    };
  } catch (error) {
    console.error(
      `[Library] Failed to start reading session for book ${bookId}, user ${user.id}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043D\u0430\u0447\u0430\u043B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0447\u0442\u0435\u043D\u0438\u044F"
    });
  }
});

export { start_post as default };
//# sourceMappingURL=start.post.mjs.map
