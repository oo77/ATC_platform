import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { getBookById, updateBook } from "../../../../../repositories/libraryRepository";
import { logActivity } from "../../../../../utils/activityLogger";
import { requireLibraryPermission } from "../../../../../utils/libraryAccess";

const LANGUAGES = ["ru", "uz", "en", "kk"];

/**
 * PATCH /api/library/admin/books/[id]
 * Обновление метаданных книги.
 *
 * Исправлено: проверка права шла по строке "library.manage" (в системе — "library:manage"),
 * поэтому редактирование всегда отвечало 403; ID книги (UUID) приводился через parseInt.
 */
const str = (v: unknown, max: number): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};

export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user);

  const bookId = event.context.params?.id;
  if (!bookId) throw createError({ statusCode: 400, message: "Некорректный ID книги" });

  const body: any = (await readBody(event).catch(() => null)) || {};
  const existing = await getBookById(bookId);
  if (!existing) throw createError({ statusCode: 404, message: "Книга не найдена" });

  const data: Record<string, any> = {};

  if (body.title !== undefined) {
    const title = str(body.title, 255);
    if (!title) throw createError({ statusCode: 400, message: "Название книги не может быть пустым" });
    data.title = title;
  }
  if (body.author !== undefined) data.author = str(body.author, 255);
  if (body.description !== undefined) data.description = str(body.description, 5000);
  if (body.isbn !== undefined) data.isbn = str(body.isbn, 20);
  if (body.category !== undefined) data.category = str(body.category, 100);
  if (body.language !== undefined) {
    const lang = String(body.language || "ru");
    if (!LANGUAGES.includes(lang)) throw createError({ statusCode: 400, message: "Неизвестный язык" });
    data.language = lang;
  }
  const yearRaw = body.publishedYear ?? body.published_year;
  if (yearRaw !== undefined) {
    if (yearRaw === null || String(yearRaw).trim() === "") {
      data.published_year = null;
    } else {
      const year = Number.parseInt(String(yearRaw), 10);
      if (!Number.isFinite(year) || year < 1000 || year > new Date().getFullYear() + 1) {
        throw createError({ statusCode: 400, message: "Некорректный год издания" });
      }
      data.published_year = year;
    }
  }

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, message: "Нет данных для обновления" });
  }

  await updateBook(bookId, data);
  const updated = await getBookById(bookId);

  const changed = Object.keys(data).filter((k) => (existing as any)[k] !== data[k]);
  await logActivity(event, "UPDATE", "LIBRARY_BOOK", bookId, updated?.title || existing.title, {
    action: "update_book",
    fields: changed,
  });

  return {
    success: true,
    book: updated && {
      id: updated.id,
      title: updated.title,
      author: updated.author,
      description: updated.description,
      isbn: updated.isbn,
      category: updated.category,
      language: updated.language,
      published_year: updated.published_year,
      updatedAt: updated.updated_at,
    },
  };
});
