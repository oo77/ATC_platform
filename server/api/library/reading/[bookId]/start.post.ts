import { getClientIp } from "../../../../utils/clientIp";
﻿import { defineEventHandler, createError, getRequestIP, getHeader } from "h3";
import { requireAuth } from "../../../../utils/auth";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { executeQuery } from "../../../../utils/db";
import { logActivity } from "../../../../utils/activityLogger";
import {
  requireBookAccess,
  closeStaleSessions,
  activeSessionSql,
} from "../../../../utils/libraryAccess";

/**
 * POST /api/library/reading/[bookId]/start
 * Начало (или продолжение) сессии чтения.
 *
 * Возвращает токен сессии: без него нельзя получить PDF и сохранить прогресс,
 * поэтому файл книги нельзя открыть прямой ссылкой в обход сессии.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const bookId = event.context.params?.bookId;
  if (!bookId) {
    throw createError({ statusCode: 400, message: "Некорректный ID книги" });
  }

  await requireBookAccess(user, bookId);

  const book = await libraryRepository.getBookById(bookId);
  if (!book) {
    throw createError({ statusCode: 404, message: "Книга не найдена" });
  }
  if (book.status !== "ready") {
    throw createError({
      statusCode: 409,
      message: book.status === "processing" ? "Книга ещё обрабатывается" : "Книга недоступна из-за ошибки обработки",
    });
  }

  await closeStaleSessions(bookId);

  const progress = await libraryRepository.getReadingProgress(user.id, bookId);
  const lastPage = Math.min(Math.max(progress?.last_page || 1, 1), Math.max(book.total_pages, 1));

  const bookPayload = {
    id: book.id,
    title: book.title,
    author: book.author,
    language: book.language,
    total_pages: book.total_pages,
  };

  // Активная сессия (например, вторая вкладка) переиспользуется
  const active = await executeQuery<any[]>(
    `SELECT s.id, s.session_token FROM book_reading_sessions s
     WHERE s.book_id = ? AND s.user_id = ? AND ${activeSessionSql("s")}
     ORDER BY s.started_at DESC LIMIT 1`,
    [bookId, user.id],
  );
  if (active[0]) {
    return {
      sessionId: active[0].id,
      token: active[0].session_token,
      book: bookPayload,
      lastPage,
      maxPage: (progress as any)?.max_page || 0,
    };
  }

  const session = await libraryRepository.createReadingSession({
    book_id: bookId,
    user_id: user.id,
    ip_address: getClientIp(event) || undefined,
    user_agent: (getHeader(event, "user-agent") || "").slice(0, 500) || undefined,
  });

  await logActivity(event, "VIEW", "LIBRARY_BOOK", bookId, book.title, {
    action: "open_book",
    page: lastPage,
  });

  return {
    sessionId: session.id,
    token: session.session_token,
    book: bookPayload,
    lastPage,
    maxPage: (progress as any)?.max_page || 0,
  };
});
