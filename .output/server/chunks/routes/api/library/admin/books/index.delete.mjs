import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../_/permissions.mjs';
import { g as getBookById, b as getBookPages, d as deleteBook } from '../../../../../_/libraryRepository.mjs';
import { unlink, rm } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';
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

const db = getDbPool();
const index_delete = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized book deletion attempt by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043A\u043D\u0438\u0433"
    });
  }
  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  console.log(
    `[Library] Book deletion requested: ID ${bookId} by user ${user.id} (${user.username})`
  );
  try {
    const book = await getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found for deletion: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const [sessions] = await db.execute(
      `SELECT COUNT(*) as count FROM book_reading_sessions 
       WHERE book_id = ? AND ended_at IS NULL`,
      [bookId]
    );
    const activeSessions = sessions[0];
    if (activeSessions && parseInt(activeSessions.count) > 0) {
      console.warn(
        `[Library] Cannot delete book ${bookId}: ${activeSessions.count} active reading sessions`
      );
      throw createError({
        statusCode: 409,
        message: `\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043D\u0438\u0433\u0443: ${activeSessions.count} \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u0435\u0441\u0441\u0438\u0439 \u0447\u0442\u0435\u043D\u0438\u044F. \u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u0438\u0445 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F.`
      });
    }
    console.log(
      `[Library] Starting deletion process for book ${bookId}: "${book.title}"`
    );
    const pages = await getBookPages(bookId);
    console.log(
      `[Library] Found ${pages.length} pages to delete for book ${bookId}`
    );
    await deleteBook(bookId);
    console.log(`[Library] Book ${bookId} deleted from database`);
    setImmediate(async () => {
      const deletedFiles = [];
      const failedFiles = [];
      try {
        if (book.original_file_path && existsSync(book.original_file_path)) {
          try {
            await unlink(book.original_file_path);
            deletedFiles.push(book.original_file_path);
            console.log(
              `[Library] Deleted original PDF: ${book.original_file_path}`
            );
          } catch (error) {
            failedFiles.push(book.original_file_path);
            console.error(
              `[Library] Failed to delete PDF ${book.original_file_path}:`,
              error
            );
          }
        }
        if (book.cover_path && existsSync(book.cover_path)) {
          try {
            await unlink(book.cover_path);
            deletedFiles.push(book.cover_path);
            console.log(`[Library] Deleted cover: ${book.cover_path}`);
          } catch (error) {
            failedFiles.push(book.cover_path);
            console.error(
              `[Library] Failed to delete cover ${book.cover_path}:`,
              error
            );
          }
        }
        for (const page of pages) {
          if (page.image_path && existsSync(page.image_path)) {
            try {
              await unlink(page.image_path);
              deletedFiles.push(page.image_path);
            } catch (error) {
              failedFiles.push(page.image_path);
              console.error(
                `[Library] Failed to delete page ${page.page_number}:`,
                error
              );
            }
          }
        }
        console.log(
          `[Library] File cleanup completed for book ${bookId}: ${deletedFiles.length} deleted, ${failedFiles.length} failed`
        );
        if (pages.length > 0 && pages[0].image_path) {
          const bookDir = dirname(pages[0].image_path);
          try {
            await rm(bookDir, { recursive: true, force: true });
            console.log(`[Library] Deleted book directory: ${bookDir}`);
          } catch (error) {
            console.warn(
              `[Library] Could not delete book directory ${bookDir}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          `[Library] Error during file cleanup for book ${bookId}:`,
          error
        );
      }
    });
    console.log(
      `[Library] Book ${bookId} ("${book.title}") successfully deleted by user ${user.id}`
    );
    return {
      success: true,
      message: "\u041A\u043D\u0438\u0433\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430",
      deletedBook: {
        id: book.id,
        title: book.title,
        author: book.author
      }
    };
  } catch (error) {
    console.error(`[Library] Failed to delete book ${bookId}:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u043A\u043D\u0438\u0433\u0438"
    });
  }
});

export { index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
