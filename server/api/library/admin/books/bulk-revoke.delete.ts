import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { executeQuery } from "../../../../utils/db";
import { logActivity } from "../../../../utils/activityLogger";
import { requireLibraryPermission } from "../../../../utils/libraryAccess";
import { Permission } from "../../../../types/permissions";

const MAX_BOOKS = 200;

/**
 * DELETE /api/library/admin/books/bulk-revoke  { bookIds: string[] }
 * Снимает все записи доступа с выбранных книг и закрывает открытые сессии чтения.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user, Permission.LIBRARY_ACCESS_MANAGE);

  const body: any = (await readBody(event).catch(() => null)) || {};
  const bookIds: string[] = Array.isArray(body.bookIds)
    ? [...new Set<string>(body.bookIds.map((id: unknown) => String(id)))]
    : [];
  if (bookIds.length === 0) throw createError({ statusCode: 400, message: "Не выбраны книги" });
  if (bookIds.length > MAX_BOOKS) {
    throw createError({ statusCode: 400, message: `За раз можно обработать не больше ${MAX_BOOKS} книг` });
  }

  const placeholders = bookIds.map(() => "?").join(",");
  const books = await executeQuery<any[]>(
    `SELECT id, title FROM books WHERE deleted_at IS NULL AND id IN (${placeholders})`,
    bookIds,
  );
  if (books.length === 0) throw createError({ statusCode: 404, message: "Книги не найдены" });

  const ids = books.map((b) => b.id);
  const idPlaceholders = ids.map(() => "?").join(",");
  const deleted: any = await executeQuery(`DELETE FROM book_access WHERE book_id IN (${idPlaceholders})`, ids);
  const closed: any = await executeQuery(
    `UPDATE book_reading_sessions s JOIN users u ON u.id = s.user_id
     SET s.ended_at = NOW()
     WHERE s.ended_at IS NULL AND s.book_id IN (${idPlaceholders}) AND u.role NOT IN ('ADMIN', 'MANAGER')`,
    ids,
  );

  const revoked = Number(deleted?.affectedRows || 0);
  const sessionsClosed = Number(closed?.affectedRows || 0);

  await logActivity(event, "UNASSIGN", "LIBRARY_BOOK", undefined, `${books.length} книг`, {
    action: "bulk_revoke_access",
    bookIds: ids,
    revoked,
    sessionsClosed,
  });

  return {
    success: true,
    revoked,
    sessionsClosed,
    message: `Отозвано записей доступа: ${revoked}${sessionsClosed ? `, закрыто сессий чтения: ${sessionsClosed}` : ""}`,
  };
});
