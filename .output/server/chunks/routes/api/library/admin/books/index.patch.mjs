import { g as defineEventHandler, G as requireAuth, h as createError, r as readBody } from '../../../../../_/nitro.mjs';
import { c as roleHasPermission } from '../../../../../_/permissions.mjs';
import { g as getBookById, u as updateBook } from '../../../../../_/libraryRepository.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const index_patch = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, "library.manage")) {
    console.error(
      `[Library] Unauthorized book update attempt by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043A\u043D\u0438\u0433\u0438"
    });
  }
  const bookId = parseInt(event.context.params?.id || "0");
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  const body = await readBody(event);
  if (!body) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
    });
  }
  console.log(
    `[Library] Book update requested: ID ${bookId} by user ${user.id} (${user.username})`
  );
  try {
    const existingBook = await getBookById(String(bookId));
    if (!existingBook) {
      console.warn(`[Library] Book not found for update: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const updateData = {};
    if (body.title !== void 0) {
      if (!body.title || body.title.trim().length === 0) {
        throw createError({
          statusCode: 400,
          message: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043D\u0438\u0433\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C"
        });
      }
      updateData.title = body.title.trim();
    }
    if (body.author !== void 0) {
      updateData.author = body.author ? body.author.trim() : null;
    }
    if (body.description !== void 0) {
      updateData.description = body.description ? body.description.trim() : null;
    }
    if (body.isbn !== void 0) {
      updateData.isbn = body.isbn ? body.isbn.trim() : null;
    }
    if (body.publisher !== void 0) {
      updateData.publisher = body.publisher ? body.publisher.trim() : null;
    }
    if (body.publishedYear !== void 0) {
      const year = parseInt(String(body.publishedYear));
      if (year && (year < 1e3 || year > (/* @__PURE__ */ new Date()).getFullYear() + 1)) {
        throw createError({
          statusCode: 400,
          message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0433\u043E\u0434 \u0438\u0437\u0434\u0430\u043D\u0438\u044F"
        });
      }
      updateData.published_year = year || null;
    }
    if (body.language !== void 0) {
      updateData.language = body.language || "ru";
    }
    if (body.category !== void 0) {
      updateData.category = body.category ? body.category.trim() : null;
    }
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F"
      });
    }
    await updateBook(String(bookId), updateData);
    const updatedBook = await getBookById(String(bookId));
    if (!updatedBook) {
      throw createError({
        statusCode: 500,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0443\u044E \u043A\u043D\u0438\u0433\u0443"
      });
    }
    console.log(
      `[Library] Book ${bookId} updated successfully by user ${user.id}. Fields: ${Object.keys(updateData).join(", ")}`
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
        updatedAt: updatedBook.updated_at
      }
    };
  } catch (error) {
    console.error(`[Library] Failed to update book ${bookId}:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043A\u043D\u0438\u0433\u0438"
    });
  }
});

export { index_patch as default };
//# sourceMappingURL=index.patch.mjs.map
