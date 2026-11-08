import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { canReadBook, getSessionByToken } from "../../../../utils/libraryAccess";

/** Сколько секунд максимум засчитываем за один heartbeat (клиент шлёт раз в 30 с) */
const MAX_SECONDS_PER_BEAT = 60;
/** Если пауза больше — читатель отходил, время не засчитываем */
const MAX_IDLE_SECONDS = 120;

/**
 * POST /api/library/reading/[bookId]/progress
 * Heartbeat сессии чтения: сохраняет текущую страницу и реальное время чтения.
 *
 * Body: { token: string, page: number, visible?: boolean }
 *
 * Каждый вызов повторно проверяет доступ: если доступ отозван, сессия
 * закрывается и клиент получает 403 — ридер сразу перестаёт показывать книгу.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({ statusCode: 400, message: "Некорректный ID книги" });
  }

  const body: any = (await readBody(event).catch(() => null)) || {};
  const page = Number.parseInt(String(body.page ?? body.lastPageRead), 10);
  if (!Number.isFinite(page) || page < 1) {
    throw createError({ statusCode: 400, message: "Некорректный номер страницы" });
  }

  const session = await getSessionByToken(user.id, bookId, body.token);
  if (!session) {
    throw createError({ statusCode: 409, message: "Сессия чтения истекла. Откройте книгу заново." });
  }

  if (!(await canReadBook(user, bookId))) {
    await libraryRepository.endReadingSession(session.id);
    throw createError({ statusCode: 403, message: "Доступ к книге был отозван" });
  }

  const book = await libraryRepository.getBookById(bookId);
  if (!book) {
    await libraryRepository.endReadingSession(session.id);
    throw createError({ statusCode: 404, message: "Книга не найдена" });
  }

  const safePage = Math.min(page, Math.max(book.total_pages, 1));
  const idle = Number(session.idle_seconds) || 0;
  const visible = body.visible !== false;
  const addSeconds = visible && idle <= MAX_IDLE_SECONDS ? Math.min(idle, MAX_SECONDS_PER_BEAT) : 0;

  await libraryRepository.updateSessionActivity(session.id, safePage, addSeconds);
  await libraryRepository.saveReadingProgress(user.id, bookId, safePage, {
    totalPages: book.total_pages,
    addSeconds,
  });

  return {
    success: true,
    progress: {
      lastPageRead: safePage,
      totalPages: book.total_pages,
      progressPercent: book.total_pages > 0 ? Math.round((safePage / book.total_pages) * 100) : 0,
      isCompleted: safePage >= book.total_pages,
    },
  };
});
