import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../../_/permissions.mjs';
import { g as getBookById } from '../../../../../../_/libraryRepository.mjs';
import { d as deleteBookFiles, g as getPDFInfo, a as generateCover } from '../../../../../../_/pdfProcessor.mjs';
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
import 'pdf-lib';
import 'sharp';
import 'fs/promises';
import 'path';

const db = getDbPool();
const reprocess_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized reprocess attempt by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043A\u043D\u0438\u0433"
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
    `[Library] Book reprocess requested: ID ${bookId} by user ${user.id} (${user.username})`
  );
  try {
    const book = await getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found for reprocessing: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const { existsSync } = await import('fs');
    if (!existsSync(book.original_file_path)) {
      console.error(
        `[Library] Original PDF not found for book ${bookId}: ${book.original_file_path}`
      );
      throw createError({
        statusCode: 404,
        message: "\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 PDF \u0444\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const [sessions] = await db.execute(
      `SELECT COUNT(*) as count FROM book_reading_sessions 
       WHERE book_id = ? AND ended_at IS NULL`,
      [bookId]
    );
    const activeSessions = sessions[0];
    if (activeSessions && Number(activeSessions.count) > 0) {
      console.log(
        `[Library] Closing ${activeSessions.count} active sessions for book ${bookId} before reprocessing`
      );
      await db.execute(
        "UPDATE book_reading_sessions SET ended_at = NOW() WHERE book_id = ? AND ended_at IS NULL",
        [bookId]
      );
    }
    await db.execute(
      "UPDATE books SET status = ?, processing_error = NULL WHERE id = ?",
      ["processing", bookId]
    );
    console.log(
      `[Library] Starting reprocessing (cache clear + metadata update) for book ${bookId}: "${book.title}"`
    );
    await deleteBookFiles(bookId);
    await db.execute("DELETE FROM book_pages WHERE book_id = ?", [bookId]);
    setImmediate(async () => {
      try {
        const pdfInfo = await getPDFInfo(book.original_file_path);
        console.log(`[Library] PDF analyzed. Pages: ${pdfInfo.pageCount}`);
        if (pdfInfo.pageCount !== book.total_pages) {
          await db.execute("UPDATE books SET total_pages = ? WHERE id = ?", [
            pdfInfo.pageCount,
            bookId
          ]);
        }
        const coverPath = await generateCover(
          bookId,
          book.original_file_path
        );
        await db.execute("UPDATE books SET cover_path = ? WHERE id = ?", [
          coverPath,
          bookId
        ]);
        console.log(`[Library] New cover generated: ${coverPath}`);
        await db.execute(
          "UPDATE books SET status = ?, updated_at = NOW() WHERE id = ?",
          ["ready", bookId]
        );
        console.log(
          `[Library] Book ${bookId} reprocessing completed successfully`
        );
      } catch (error) {
        console.error(`[Library] Error reprocessing book ${bookId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await db.execute(
          "UPDATE books SET status = ?, processing_error = ? WHERE id = ?",
          ["error", errorMessage, bookId]
        );
      }
    });
    console.log(
      `[Library] Reprocessing initiated for book ${bookId} by user ${user.id}`
    );
    return {
      success: true,
      message: "\u041F\u0435\u0440\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043A\u043D\u0438\u0433\u0438 \u043D\u0430\u0447\u0430\u0442\u0430 (\u043A\u044D\u0448 \u043E\u0447\u0438\u0449\u0435\u043D, \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F)",
      book: {
        id: bookId,
        title: book.title,
        processingStatus: "processing"
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to initiate reprocessing for book ${bookId}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u043A\u043D\u0438\u0433\u0438"
    });
  }
});

export { reprocess_post as default };
//# sourceMappingURL=reprocess.post.mjs.map
