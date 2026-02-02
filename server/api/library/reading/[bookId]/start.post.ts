import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../utils/db";

const db = getDbPool();

/**
 * POST /api/library/reading/[bookId]/start
 * Начало сессии чтения книги
 *
 * Создает новую сессию чтения и возвращает информацию для начала чтения
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

  console.log(
    `[Library] Reading session start requested for book ${bookId} by user ${user.id} (${user.username})`,
  );

  try {
    // Проверка доступа
    const hasAccess = await libraryRepository.checkUserBookAccess(
      user.id,
      bookId,
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
    const book = await libraryRepository.getBookById(bookId);
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
        `[Library] Book ${bookId} is not ready: status ${book.status}`,
      );
      throw createError({
        statusCode: 409,
        message: "Книга еще не готова для чтения",
      });
    }

    // Проверка активной сессии
    const [sessions] = await db.execute<any[]>(
      "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
      [bookId, user.id],
    );
    const activeSession = sessions[0];

    // Получаем прогресс чтения
    const progress = await libraryRepository.getReadingProgress(
      user.id,
      bookId,
    );
    const lastPage = progress?.last_page || 1;

    if (activeSession) {
      console.log(
        `[Library] User ${user.id} already has active session ${activeSession.id} for book ${bookId}`,
      );

      return {
        sessionId: activeSession.id,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          total_pages: book.total_pages,
        },
        lastPage,
      };
    }

    // Создание новой сессии
    const sessionResult = await libraryRepository.createReadingSession({
      book_id: bookId,
      user_id: user.id,
    });

    console.log(
      `[Library] New reading session ${sessionResult.id} started for user ${user.id}, book ${bookId}`,
    );

    return {
      sessionId: sessionResult.id,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        total_pages: book.total_pages,
      },
      lastPage,
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to start reading session for book ${bookId}, user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при начале сессии чтения",
    });
  }
});
