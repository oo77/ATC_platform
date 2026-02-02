import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";

/**
 * GET /api/library/reading/[bookId]/progress
 * Получение прогресса чтения книги
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

  // console.log(
  //   `[Library] Progress requested for book ${bookId} by user ${user.id}`,
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

    // Получение книги
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Получение прогресса
    const progress = await libraryRepository.getReadingProgress(
      String(user.id),
      bookId,
    );

    const lastPageRead = progress?.last_page || 0;
    const totalPages = book.total_pages; // Было page_count
    const progressPercent =
      totalPages > 0 ? Math.round((lastPageRead / totalPages) * 100) : 0;

    return {
      success: true,
      progress: {
        lastPageRead,
        totalPages,
        progressPercent,
        isCompleted: lastPageRead >= totalPages,
        lastUpdated: progress?.last_read_at || null,
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to fetch progress for book ${bookId}, user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении прогресса",
    });
  }
});
