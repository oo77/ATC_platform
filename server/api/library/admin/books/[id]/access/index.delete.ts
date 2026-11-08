import { defineEventHandler, createError, getQuery, readBody } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import { executeQuery } from "../../../../../../utils/db";
import { logActivity } from "../../../../../../utils/activityLogger";
import { requireLibraryPermission } from "../../../../../../utils/libraryAccess";
import { Permission } from "../../../../../../types/permissions";

/**
 * DELETE /api/library/admin/books/[id]/access  { accessId }
 * Отзыв записи доступа.
 *
 * Раньше отзыв блокировался, пока у читателя открыта сессия (а «зависшие»
 * сессии не закрывались никогда — доступ нельзя было забрать вовсе).
 * Теперь доступ снимается сразу: ридер проверяет его при каждом heartbeat
 * и закрывает книгу не позже чем через 30 секунд.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user, Permission.LIBRARY_ACCESS_MANAGE);

  const bookId = event.context.params?.id;
  let accessId = getQuery(event).accessId as string | undefined;
  if (!accessId) {
    const body: any = await readBody(event).catch(() => null);
    accessId = body?.accessId;
  }
  if (!bookId || !accessId) {
    throw createError({ statusCode: 400, message: "Требуются bookId и accessId" });
  }

  const [access] = await executeQuery<any[]>(
    `SELECT ba.*, b.title FROM book_access ba JOIN books b ON b.id = ba.book_id
     WHERE ba.id = ? AND ba.book_id = ? LIMIT 1`,
    [String(accessId), bookId],
  );
  if (!access) throw createError({ statusCode: 404, message: "Запись доступа не найдена" });

  await executeQuery("DELETE FROM book_access WHERE id = ?", [access.id]);

  await logActivity(event, "UNASSIGN", "LIBRARY_BOOK", bookId, access.title, {
    action: "revoke_access",
    userId: access.user_id,
    groupId: access.group_id,
    courseId: access.course_id,
    role: access.role_name,
  });

  return { success: true, message: "Доступ отозван" };
});
