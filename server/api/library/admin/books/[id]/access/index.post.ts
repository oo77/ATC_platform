import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import * as libraryRepository from "../../../../../../repositories/libraryRepository";
import { logActivity } from "../../../../../../utils/activityLogger";
import { requireLibraryPermission } from "../../../../../../utils/libraryAccess";
import { Permission } from "../../../../../../types/permissions";
import {
  resolveAccessTarget,
  parseExpiresAt,
  grantBookAccess,
} from "../../../../../../services/libraryAccessService";

/**
 * POST /api/library/admin/books/[id]/access
 * Body: { type: "user" | "group" | "course" | "role", targetId: string, expiresAt?: string | null }
 * (поддерживаются и старые поля userId / groupId / roleName)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user, Permission.LIBRARY_ACCESS_MANAGE);

  const bookId = event.context.params?.id;
  if (!bookId) throw createError({ statusCode: 400, message: "Некорректный ID книги" });

  const body: any = (await readBody(event).catch(() => null)) || {};
  const type = body.type || (body.userId ? "user" : body.groupId ? "group" : body.courseId ? "course" : body.roleName ? "role" : undefined);
  const targetId = body.targetId ?? body.userId ?? body.groupId ?? body.courseId ?? body.roleName;

  const book = await libraryRepository.getBookById(bookId);
  if (!book) throw createError({ statusCode: 404, message: "Книга не найдена" });

  const target = await resolveAccessTarget(type, targetId);
  const expiresAt = parseExpiresAt(body.expiresAt);
  const result = await grantBookAccess(bookId, target, user.id, expiresAt);

  await logActivity(event, "ASSIGN", "LIBRARY_BOOK", bookId, book.title, {
    action: "grant_access",
    targetType: target.type,
    targetId: target.id,
    target: target.label,
    expiresAt: expiresAt?.toISOString() || null,
    result,
  });

  return {
    success: true,
    result,
    message:
      result === "created"
        ? `Доступ выдан: ${target.label}`
        : `Доступ обновлён: ${target.label}`,
  };
});
