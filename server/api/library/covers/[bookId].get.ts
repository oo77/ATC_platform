import { defineEventHandler, createError, getRouterParam } from "h3";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { executeQuery } from "../../../utils/db";

/**
 * GET /api/library/covers/:bookId
 * Получение обложки книги (первая страница PDF)
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

    // Проверяем все возможные форматы обложек (pdf → png → webp)
    const coversDir = path.join(process.cwd(), "storage", "library", "covers");
    const extensions = ["pdf", "png", "webp"];
    let coverPath = "";
    let contentType = "";

    for (const ext of extensions) {
      const candidatePath = path.join(coversDir, `${bookId}.${ext}`);
      if (existsSync(candidatePath)) {
        coverPath = candidatePath;
        contentType =
          ext === "pdf"
            ? "application/pdf"
            : ext === "png"
              ? "image/png"
              : "image/webp";
        break;
      }
    }

    if (!coverPath) {
      console.error(
        `[Library] Cover file not found for book ${bookId} in any format`,
      );
      throw createError({
        statusCode: 404,
        message: "Cover file not found",
      });
    }

    // Читаем файл
    const coverBuffer = await readFile(coverPath);

    // Устанавливаем заголовки
    event.node.res.setHeader("Content-Type", contentType);
    event.node.res.setHeader("Cache-Control", "public, max-age=31536000");
    event.node.res.setHeader("Content-Length", coverBuffer.length);

    console.log(
      `[Library] Served cover for book ${bookId} (${contentType}, ${coverBuffer.length} bytes)`,
    );

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
