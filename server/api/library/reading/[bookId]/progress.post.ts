import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { executeQuery } from "../../../../utils/db";

/**
 * POST /api/library/reading/[bookId]/progress
 * Сохранение прогресса чтения
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as any;

  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  const body: any = (await readBody(event)) || {};
  const lastPageRead = parseInt(body.lastPageRead);

  if (!lastPageRead || lastPageRead < 1) {
    throw createError({
      statusCode: 400,
      message: "Некорректный номер страницы",
    });
  }

  // console.log(
  //   `[Library] Progress update for book ${bookId} by user ${user.id}: page ${lastPageRead}`,
  // );

  try {
    // Проверка доступа
    const hasAccess = await libraryRepository.checkUserBookAccess(
      String(user.id),
      bookId,
    );
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        message: "У вас нет доступа к этой книге",
      });
    }

    // Получение книги для валидации номера страницы
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    if (lastPageRead > book.total_pages) {
      throw createError({
        statusCode: 400,
        message: `Номер страницы превышает количество страниц в книге (${book.total_pages})`,
      });
    }

    // Проверка активной сессии
    const sessions = await executeQuery<any[]>(
      `SELECT * FROM book_reading_sessions 
       WHERE book_id = ? 
         AND user_id = ? 
         AND ended_at IS NULL LIMIT 1`,
      [bookId, user.id],
    );
    const activeSession = sessions[0];

    if (!activeSession) {
      throw createError({
        statusCode: 409,
        message: "Нет активной сессии чтения",
      });
    }

    // Обновление прогресса
    await libraryRepository.saveReadingProgress(
      String(user.id),
      bookId,
      lastPageRead,
    );

    // Также можно обновить активность сессии
    await libraryRepository.updateSessionActivity(
      activeSession.id,
      lastPageRead,
    );

    const progressPercent = Math.round((lastPageRead / book.total_pages) * 100);

    return {
      success: true,
      progress: {
        lastPageRead,
        totalPages: book.total_pages,
        progressPercent,
        isCompleted: lastPageRead >= book.total_pages,
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to save progress for book ${bookId}, user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при сохранении прогресса",
    });
  }
});
