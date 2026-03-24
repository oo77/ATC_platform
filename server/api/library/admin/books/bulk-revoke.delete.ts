import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { roleHasPermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import { getDbPool } from "../../../../utils/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const db = getDbPool();

/**
 * DELETE /api/library/admin/books/bulk-revoke
 * Массовое удаление ВСЕХ доступов из выбранных книг
 *
 * Требуемые права: library.manage
 *
 * Body:
 * - bookIds: string[] - массив ID книг, из которых отзывать все доступы
 * - force?: boolean  - принудительно закрыть активные сессии (по умолчанию false)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized bulk revoke attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для отзыва доступов к книгам",
    });
  }

  const body = await readBody<{
    bookIds: string[];
    force?: boolean;
  }>(event);

  if (!body || !body.bookIds || body.bookIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Не указаны книги для отзыва доступов",
    });
  }

  // Экранируем bookIds для безопасного использования в IN-клаузе
  const bookIds = body.bookIds.map((id) => String(id));
  const force = body.force === true;

  console.log(
    `[Library] Bulk revoke requested by user ${user.id} for ${bookIds.length} books, force=${force}`,
  );

  const results: {
    bookId: string;
    bookTitle: string;
    success: boolean;
    message: string;
    revokedCount?: number;
    closedSessionsCount?: number;
  }[] = [];

  for (const bookId of bookIds) {
    try {
      // Проверяем существование книги
      const [books] = await db.execute<RowDataPacket[]>(
        "SELECT id, title FROM books WHERE id = ? AND deleted_at IS NULL LIMIT 1",
        [bookId],
      );

      if (books.length === 0) {
        results.push({
          bookId,
          bookTitle: bookId,
          success: false,
          message: "Книга не найдена",
        });
        continue;
      }

      const bookTitle = books[0].title;

      // Считаем активные сессии чтения по этой книге
      const [activeSessions] = await db.execute<RowDataPacket[]>(
        `SELECT brs.id, brs.user_id
         FROM book_reading_sessions brs
         INNER JOIN book_access ba ON ba.book_id = brs.book_id AND ba.user_id = brs.user_id
         WHERE brs.book_id = ? AND brs.ended_at IS NULL`,
        [bookId],
      );

      let closedSessionsCount = 0;

      if (activeSessions.length > 0 && !force) {
        results.push({
          bookId,
          bookTitle,
          success: false,
          message: `Есть ${activeSessions.length} активных сессий чтения. Используйте force=true для принудительного отзыва.`,
        });
        continue;
      }

      // Принудительно закрываем активные сессии (если force=true или их нет)
      if (activeSessions.length > 0) {
        const [closeResult] = await db.execute<ResultSetHeader>(
          "UPDATE book_reading_sessions SET ended_at = NOW() WHERE book_id = ? AND ended_at IS NULL",
          [bookId],
        );
        closedSessionsCount = closeResult.affectedRows;
        console.log(
          `[Library] Bulk revoke: closed ${closedSessionsCount} active sessions for book ${bookId}`,
        );
      }

      // Удаляем ВСЕ записи доступа для данной книги
      const [deleteResult] = await db.execute<ResultSetHeader>(
        "DELETE FROM book_access WHERE book_id = ?",
        [bookId],
      );

      const revokedCount = deleteResult.affectedRows;

      console.log(
        `[Library] Bulk revoke: removed ${revokedCount} access records for book "${bookTitle}" (${bookId}), closed ${closedSessionsCount} sessions`,
      );

      results.push({
        bookId,
        bookTitle,
        success: true,
        message:
          revokedCount > 0
            ? `Отозвано доступов: ${revokedCount}`
            : "Не было активных доступов",
        revokedCount,
        closedSessionsCount,
      });
    } catch (error: any) {
      console.error(
        `[Library] Bulk revoke failed for book ${bookId}:`,
        error.message,
      );
      results.push({
        bookId,
        bookTitle: bookId,
        success: false,
        message: error.message || "Ошибка при отзыве доступов",
      });
    }
  }

  const totalRevoked = results.reduce(
    (sum, r) => sum + (r.revokedCount || 0),
    0,
  );
  const totalSessionsClosed = results.reduce(
    (sum, r) => sum + (r.closedSessionsCount || 0),
    0,
  );
  const successCount = results.filter((r) => r.success).length;

  console.log(
    `[Library] Bulk revoke completed: ${successCount}/${bookIds.length} books processed, ${totalRevoked} access records removed, ${totalSessionsClosed} sessions closed`,
  );

  return {
    success: true,
    message: `Обработано книг: ${successCount} из ${bookIds.length}. Отозвано доступов: ${totalRevoked}.${totalSessionsClosed > 0 ? ` Закрыто сессий: ${totalSessionsClosed}.` : ""}`,
    results,
    totalRevoked,
    totalSessionsClosed,
    successCount,
  };
});
