import {
  defineEventHandler,
  createError,
  H3Event,
  setResponseHeader,
} from "h3";
import { requireAuth } from "../../../../../utils/auth";
import * as libraryRepository from "../../../../../repositories/libraryRepository";
import * as pdfProcessor from "../../../../../utils/pdfProcessor";
import { executeQuery } from "../../../../../utils/db";

/**
 * GET /api/library/reading/[bookId]/page/[pageNumber]
 * Получение страницы книги (on-demand rendering)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as any;

  const bookId = event.context.params?.bookId;
  const pageNumber = parseInt(event.context.params?.pageNumber || "0");

  if (!bookId || !pageNumber || pageNumber < 1) {
    throw createError({
      statusCode: 400,
      message: "Некорректные параметры",
    });
  }

  try {
    // 1. Проверка доступа через репозиторий
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

    // 2. Проверка активной сессии
    const sessions = await executeQuery<any[]>(
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
        statusCode: 409,
        message: "Нет активной сессии чтения. Начните чтение заново.",
      });
    }

    // 3. Получение информации о книге
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    if (pageNumber > book.total_pages) {
      throw createError({
        statusCode: 404,
        message: "Страница не найдена",
      });
    }

    // 4. Получение изображения страницы (генерация на лету или из кэша)
    const imageBuffer = await pdfProcessor.getPageImage(
      bookId,
      pageNumber,
      book.original_file_path,
    );

    // 5. Обновление прогресса (Fire & Forget)
    libraryRepository
      .saveReadingProgress(String(user.id), bookId, pageNumber)
      .catch((err: any) => {
        console.error(`[Library] Failed to update reading progress:`, err);
      });

    // Обновляем активность сессии
    libraryRepository
      .updateSessionActivity(activeSession.id, pageNumber)
      .catch((err: any) => {
        console.error(`[Library] Failed to update session activity:`, err);
      });

    // 6. Возврат изображения
    setResponseHeader(event, "Content-Type", "image/png");
    setResponseHeader(
      event,
      "Cache-Control",
      "private, max-age=3600", // Кэшируем на час в браузере, так как страница статична
    );

    return imageBuffer;
  } catch (error: any) {
    console.error(
      `[Library] Failed to serve page ${pageNumber} of book ${bookId} to user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при загрузке страницы",
    });
  }
});
