import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { executeQuery } from "../../../../utils/db";
import { logActivity } from "../../../../utils/activityLogger";
import { requireLibraryPermission } from "../../../../utils/libraryAccess";
import { Permission } from "../../../../types/permissions";
import {
  resolveAccessTarget,
  parseExpiresAt,
  grantBookAccess,
} from "../../../../services/libraryAccessService";

const MAX_BOOKS = 200;

/**
 * POST /api/library/admin/books/bulk-access
 * Body: { bookIds: string[], type: "user"|"group"|"course"|"role", targetId: string, expiresAt?: string|null }
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user, Permission.LIBRARY_ACCESS_MANAGE);

  const body: any = (await readBody(event).catch(() => null)) || {};
  const bookIds: string[] = Array.isArray(body.bookIds)
    ? [...new Set<string>(body.bookIds.map((id: unknown) => String(id)))]
    : [];
  if (bookIds.length === 0) {
    throw createError({ statusCode: 400, message: "Не выбраны книги" });
  }
  if (bookIds.length > MAX_BOOKS) {
    throw createError({ statusCode: 400, message: `За раз можно обработать не больше ${MAX_BOOKS} книг` });
  }

  const targetId = body.targetId ?? body.userId ?? body.groupId ?? body.courseId ?? body.roleName;
  const target = await resolveAccessTarget(body.type, targetId);
  const expiresAt = parseExpiresAt(body.expiresAt);

  const books = await executeQuery<any[]>(
    `SELECT id, title FROM books WHERE deleted_at IS NULL AND id IN (${bookIds.map(() => "?").join(",")})`,
    bookIds,
  );

  let created = 0;
  let updated = 0;
  for (const book of books) {
    const result = await grantBookAccess(book.id, target, user.id, expiresAt);
    if (result === "created") created++;
    else updated++;
  }

  await logActivity(event, "ASSIGN", "LIBRARY_BOOK", undefined, `${books.length} книг`, {
    action: "bulk_grant_access",
    bookIds: books.map((b) => b.id),
    targetType: target.type,
    target: target.label,
    expiresAt: expiresAt?.toISOString() || null,
    created,
    updated,
  });

  const missing = bookIds.length - books.length;
  return {
    success: true,
    created,
    updated,
    missing,
    message: `${target.label}: выдан доступ к ${created} книг${updated ? `, обновлено ${updated}` : ""}${missing ? `, не найдено ${missing}` : ""}`,
  };
});
