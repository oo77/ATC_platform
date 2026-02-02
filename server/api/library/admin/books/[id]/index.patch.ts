import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { roleHasPermission } from "../../../../../utils/permissions";
import {
  getBookById,
  updateBook,
} from "../../../../../repositories/libraryRepository";

interface UpdateBookBody {
  title?: string;
  author?: string;
  description?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
  language?: string;
  category?: string;
}

/**
 * PATCH /api/library/admin/books/[id]
 * Обновление метаданных книги
 *
 * Требуемые права: library.manage
 *
 * Body:
 * - title?: string
 * - author?: string
 * - description?: string
 * - isbn?: string
 * - publisher?: string
 * - publishedYear?: number
 * - language?: string
 * - category?: string
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, "library.manage" as any)) {
    console.error(
      `[Library] Unauthorized book update attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для обновления книги",
    });
  }

  const bookId = parseInt(event.context.params?.id || "0");
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  const body = await readBody<UpdateBookBody>(event);

  if (!body) {
    throw createError({
      statusCode: 400,
      message: "Отсутствуют данные в запросе",
    });
  }

  console.log(
    `[Library] Book update requested: ID ${bookId} by user ${user.id} (${user.username})`,
  );

  try {
    // Проверка существования книги
    const existingBook = await getBookById(String(bookId));
    if (!existingBook) {
      console.warn(`[Library] Book not found for update: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Валидация и подготовка данных для обновления
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) {
      if (!body.title || body.title.trim().length === 0) {
        throw createError({
          statusCode: 400,
          message: "Название книги не может быть пустым",
        });
      }
      updateData.title = body.title.trim();
    }

    if (body.author !== undefined) {
      updateData.author = body.author ? body.author.trim() : null;
    }

    if (body.description !== undefined) {
      updateData.description = body.description
        ? body.description.trim()
        : null;
    }

    if (body.isbn !== undefined) {
      updateData.isbn = body.isbn ? body.isbn.trim() : null;
    }

    if (body.publisher !== undefined) {
      updateData.publisher = body.publisher ? body.publisher.trim() : null;
    }

    if (body.publishedYear !== undefined) {
      const year = parseInt(String(body.publishedYear));
      if (year && (year < 1000 || year > new Date().getFullYear() + 1)) {
        throw createError({
          statusCode: 400,
          message: "Некорректный год издания",
        });
      }
      updateData.published_year = year || null;
    }

    if (body.language !== undefined) {
      updateData.language = body.language || "ru";
    }

    if (body.category !== undefined) {
      updateData.category = body.category ? body.category.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: "Нет данных для обновления",
      });
    }

    // Обновление книги
    await updateBook(String(bookId), updateData);
    const updatedBook = await getBookById(String(bookId));

    if (!updatedBook) {
      throw createError({
        statusCode: 500,
        message: "Не удалось получить обновленную книгу",
      });
    }

    console.log(
      `[Library] Book ${bookId} updated successfully by user ${user.id}. Fields: ${Object.keys(updateData).join(", ")}`,
    );

    return {
      success: true,
      book: {
        id: updatedBook.id,
        title: updatedBook.title,
        author: updatedBook.author,
        description: updatedBook.description,
        isbn: updatedBook.isbn,
        category: updatedBook.category,
        updatedAt: updatedBook.updated_at,
      },
    };
  } catch (error: any) {
    console.error(`[Library] Failed to update book ${bookId}:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при обновлении книги",
    });
  }
});
