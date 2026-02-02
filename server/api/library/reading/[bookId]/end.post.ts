import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../utils/db";

const db = getDbPool();

/**
 * POST /api/library/reading/[bookId]/end
 * Завершение сессии чтения
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;

  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  try {
    // Получение активной сессии
    const [sessions] = await db.execute<any[]>(
      `SELECT * FROM book_reading_sessions 
       WHERE book_id = ? 
         AND user_id = ? 
         AND ended_at IS NULL 
       ORDER BY started_at DESC LIMIT 1`,
      [bookId, user.id],
    );
    const activeSession = sessions[0];

    if (!activeSession) {
      throw createError({
        statusCode: 404,
        message: "Нет активной сессии чтения",
      });
    }

    // Завершение сессии
    await libraryRepository.endReadingSession(activeSession.id);

    // Вычисление длительности сессии
    const startedAt = new Date(activeSession.started_at);
    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000,
    );

    return {
      success: true,
      session: {
        id: activeSession.id,
        bookId: bookId,
        startedAt: activeSession.started_at,
        endedAt: endedAt,
        durationSeconds,
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to end reading session for book ${bookId}, user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при завершении сессии чтения",
    });
  }
});
