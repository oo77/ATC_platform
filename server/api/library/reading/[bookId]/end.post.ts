import { defineEventHandler, createError, readBody } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { getSessionByToken } from "../../../../utils/libraryAccess";

/**
 * POST /api/library/reading/[bookId]/end
 * Завершение сессии чтения. Вызывается из ридера при уходе со страницы,
 * в том числе через navigator.sendBeacon (тело — JSON-строка { token, page }).
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({ statusCode: 400, message: "Некорректный ID книги" });
  }

  let body: any = await readBody(event).catch(() => null);
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }

  const session = await getSessionByToken(user.id, bookId, body?.token);
  if (!session) {
    // Сессия уже закрыта (истекла или закрыта из другой вкладки) — это не ошибка
    return { success: true, alreadyClosed: true };
  }

  const page = Number.parseInt(String(body?.page ?? ""), 10);
  if (Number.isFinite(page) && page > 0) {
    const book = await libraryRepository.getBookById(bookId);
    if (book) {
      const safePage = Math.min(page, Math.max(book.total_pages, 1));
      await libraryRepository.updateSessionActivity(session.id, safePage, 0);
      await libraryRepository.saveReadingProgress(user.id, bookId, safePage, { totalPages: book.total_pages });
    }
  }

  await libraryRepository.endReadingSession(session.id);
  return { success: true };
});
