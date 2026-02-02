import { defineEventHandler, createError, getRouterParam } from "h3";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { executeQuery } from "../../../utils/db";

/**
 * GET /api/library/covers/:bookId
 * Получение обложки книги
 */
export default defineEventHandler(async (event) => {
  const bookId = getRouterParam(event, "bookId");

  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Book ID is required",
    });
  }

  try {
    // Получаем информацию о книге из БД
    const books = await executeQuery<any[]>(
      "SELECT cover_path FROM books WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [bookId],
    );

    if (!books || books.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Book not found",
      });
    }

    const book = books[0];

    // Если обложки нет, возвращаем 404
    if (!book.cover_path) {
      throw createError({
        statusCode: 404,
        message: "Cover not found",
      });
    }

    // Формируем полный путь к обложке
    const coverPath = path.join(
      process.cwd(),
      "storage",
      "library",
      "covers",
      `${bookId}.webp`,
    );

    // Проверяем существование файла
    if (!existsSync(coverPath)) {
      console.error(`[Library] Cover file not found: ${coverPath}`);
      throw createError({
        statusCode: 404,
        message: "Cover file not found",
      });
    }

    // Читаем файл
    const coverBuffer = await readFile(coverPath);

    // Устанавливаем заголовки
    event.node.res.setHeader("Content-Type", "image/webp");
    event.node.res.setHeader("Cache-Control", "public, max-age=31536000"); // Кэш на год
    event.node.res.setHeader("Content-Length", coverBuffer.length);

    return coverBuffer;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error(`[Library] Failed to serve cover for book ${bookId}:`, error);
    throw createError({
      statusCode: 500,
      message: "Failed to load cover",
    });
  }
});
