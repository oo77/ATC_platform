import { defineEventHandler, createError, getRouterParam, setResponseHeader, sendStream } from "h3";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { requireAuth } from "../../../utils/auth";
import { canReadBook } from "../../../utils/libraryAccess";

const COVERS_DIR = path.join(process.cwd(), "storage", "library", "covers");
const TYPES: [string, string][] = [
  ["pdf", "application/pdf"],
  ["webp", "image/webp"],
  ["png", "image/png"],
];

/**
 * GET /api/library/covers/:bookId
 * Обложка книги (первая страница PDF). Раньше отдавалась без проверки доступа —
 * теперь её видят только те, кто может открыть книгу.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = getRouterParam(event, "bookId");
  if (!bookId || !/^[0-9a-f-]{36}$/i.test(bookId)) {
    throw createError({ statusCode: 400, message: "Некорректный ID книги" });
  }

  if (!(await canReadBook(user, bookId))) {
    throw createError({ statusCode: 404, message: "Обложка не найдена" });
  }

  for (const [ext, type] of TYPES) {
    const file = path.join(COVERS_DIR, `${bookId}.${ext}`);
    if (!existsSync(file)) continue;
    const { size } = await stat(file);
    setResponseHeader(event, "Content-Type", type);
    setResponseHeader(event, "Content-Length", size);
    setResponseHeader(event, "Cache-Control", "private, max-age=86400");
    setResponseHeader(event, "X-Content-Type-Options", "nosniff");
    return sendStream(event, createReadStream(file));
  }

  throw createError({ statusCode: 404, message: "Обложка не найдена" });
});
