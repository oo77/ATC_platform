import { defineEventHandler, createError, setResponseHeader, setResponseStatus, sendStream, getHeader } from "h3";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { canReadBook, getSessionByToken, readSessionToken } from "../../../../utils/libraryAccess";

/**
 * GET /api/library/reading/[bookId]/raw?token=...
 * PDF книги для просмотра в браузере (pdf.js).
 *
 * - Требует доступ к книге И токен активной сессии чтения этого пользователя.
 * - Поддерживает HTTP Range: pdf.js подгружает только нужные части файла,
 *   поэтому большие книги открываются сразу, без скачивания целиком.
 * - Не кэшируется браузером и прокси (no-store).
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({ statusCode: 400, message: "Некорректные параметры" });
  }

  const token = await readSessionToken(event);
  const session = await getSessionByToken(user.id, bookId, token);
  if (!session) {
    throw createError({ statusCode: 409, message: "Нет активной сессии чтения. Откройте книгу заново." });
  }

  if (!(await canReadBook(user, bookId))) {
    await libraryRepository.endReadingSession(session.id);
    throw createError({ statusCode: 403, message: "У вас нет доступа к этой книге" });
  }

  const book = await libraryRepository.getBookById(bookId);
  if (!book || book.status !== "ready" || !book.original_file_path) {
    throw createError({ statusCode: 404, message: "Книга недоступна" });
  }

  let size: number;
  try {
    size = (await stat(book.original_file_path)).size;
  } catch {
    console.error(`[Library] PDF file missing for book ${bookId}: ${book.original_file_path}`);
    throw createError({ statusCode: 404, message: "Файл книги не найден" });
  }

  setResponseHeader(event, "Content-Type", "application/pdf");
  setResponseHeader(event, "Accept-Ranges", "bytes");
  setResponseHeader(event, "Cache-Control", "private, no-store, max-age=0");
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");
  setResponseHeader(event, "X-Robots-Tag", "noindex, nofollow");
  setResponseHeader(event, "Content-Disposition", 'inline; filename="book.pdf"');

  const range = getHeader(event, "range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    let start = match && match[1] ? Number(match[1]) : NaN;
    let end = match && match[2] ? Number(match[2]) : size - 1;
    if (match && !match[1] && match[2]) {
      // bytes=-N — последние N байт
      start = Math.max(size - Number(match[2]), 0);
      end = size - 1;
    }
    if (!match || !Number.isFinite(start) || start > end || start >= size) {
      setResponseStatus(event, 416);
      setResponseHeader(event, "Content-Range", `bytes */${size}`);
      return "";
    }
    end = Math.min(end, size - 1);
    setResponseStatus(event, 206);
    setResponseHeader(event, "Content-Range", `bytes ${start}-${end}/${size}`);
    setResponseHeader(event, "Content-Length", end - start + 1);
    return sendStream(event, createReadStream(book.original_file_path, { start, end }));
  }

  setResponseHeader(event, "Content-Length", size);
  return sendStream(event, createReadStream(book.original_file_path));
});
