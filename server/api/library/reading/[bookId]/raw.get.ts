import { defineEventHandler, createError, setResponseHeader } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { executeQuery } from "../../../../utils/db";
import fs from "fs/promises";

/**
 * GET /api/library/reading/[bookId]/raw
 * Отдаёт сырой PDF файл для браузерного рендеринга через pdfjs-dist.
 * Проверяет права доступа и наличие активной сессии чтения.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as any;
  const bookId = event.context.params?.bookId;

  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректные параметры",
    });
  }

  try {
    // 1. Проверка доступа к книге
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

    // 2. Проверка активной сессии чтения
    const sessions = await executeQuery<any[]>(
      `SELECT id FROM book_reading_sessions
       WHERE book_id = ?
         AND user_id = ?
         AND ended_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [bookId, user.id],
    );

    if (!sessions[0]) {
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

    // 4. Логирование доступа
    console.log(
      `[Library] User ${user.id} opened raw PDF for book ${bookId} ("${book.title}")`,
    );

    // 5. Чтение и отдача PDF файла
    const pdfBuffer = await fs.readFile(book.original_file_path);

    setResponseHeader(event, "Content-Type", "application/pdf");
    setResponseHeader(event, "Content-Length", pdfBuffer.length);
    setResponseHeader(event, "Cache-Control", "private, max-age=3600");
    setResponseHeader(
      event,
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(book.title)}.pdf"`,
    );

    return pdfBuffer;
  } catch (error: any) {
    console.error(
      `[Library] Failed to serve raw PDF for book ${bookId} to user ${user.id}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при загрузке книги",
    });
  }
});
