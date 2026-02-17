import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../_/nitro.mjs';
import { f as endReadingSession } from '../../../../../_/libraryRepository.mjs';
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
const end_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  try {
    const [sessions] = await db.execute(
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
        statusCode: 404,
        message: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438 \u0447\u0442\u0435\u043D\u0438\u044F"
      });
    }
    await endReadingSession(activeSession.id);
    const startedAt = new Date(activeSession.started_at);
    const endedAt = /* @__PURE__ */ new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1e3
    );
    return {
      success: true,
      session: {
        id: activeSession.id,
        bookId,
        startedAt: activeSession.started_at,
        endedAt,
        durationSeconds
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to end reading session for book ${bookId}, user ${user.id}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0438 \u0447\u0442\u0435\u043D\u0438\u044F"
    });
  }
});

export { end_post as default };
//# sourceMappingURL=end.post.mjs.map
