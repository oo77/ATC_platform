import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import { executeQuery } from "../../../../../../utils/db";
import { requireLibraryPermission, ROLE_LABELS } from "../../../../../../utils/libraryAccess";

/**
 * GET /api/library/admin/books/[id]/access
 * Все записи доступа к книге: кому выдан, кем, до какого срока и сколько
 * человек он реально покрывает (для групп, курсов и ролей).
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user);

  const bookId = event.context.params?.id;
  if (!bookId) throw createError({ statusCode: 400, message: "Некорректный ID книги" });

  const [book] = await executeQuery<any[]>(
    "SELECT id, title, total_pages FROM books WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [bookId],
  );
  if (!book) throw createError({ statusCode: 404, message: "Книга не найдена" });

  const rows = await executeQuery<any[]>(
    `SELECT ba.id, ba.user_id, ba.group_id, ba.course_id, ba.role_name,
            ba.created_at, ba.expires_at,
            u.name AS user_name, u.email AS user_email, u.role AS user_role,
            sg.code AS group_code, gc.name AS group_course,
            c.name AS course_name,
            gb.name AS granted_by_name,
            brp.max_page, brp.last_read_at, brp.total_seconds,
            CASE
              WHEN ba.group_id IS NOT NULL THEN (SELECT COUNT(*) FROM study_group_students x WHERE x.group_id = ba.group_id)
              WHEN ba.course_id IS NOT NULL THEN (
                SELECT COUNT(DISTINCT x.student_id) FROM study_group_students x
                JOIN study_groups g ON g.id = x.group_id WHERE g.course_id = ba.course_id)
              WHEN ba.role_name IS NOT NULL THEN (SELECT COUNT(*) FROM users r WHERE r.role = ba.role_name)
              ELSE 1
            END AS members
     FROM book_access ba
     LEFT JOIN users u ON u.id = ba.user_id
     LEFT JOIN study_groups sg ON sg.id = ba.group_id
     LEFT JOIN courses gc ON gc.id = sg.course_id
     LEFT JOIN courses c ON c.id = ba.course_id
     LEFT JOIN users gb ON gb.id = ba.granted_by
     LEFT JOIN book_reading_progress brp ON brp.book_id = ba.book_id AND brp.user_id = ba.user_id
     WHERE ba.book_id = ?
     ORDER BY ba.created_at DESC`,
    [bookId],
  );

  const now = Date.now();
  const total = Number(book.total_pages) || 0;
  const accessList = rows.map((r) => {
    const type = r.user_id ? "user" : r.group_id ? "group" : r.course_id ? "course" : "role";
    const name =
      type === "user"
        ? r.user_name || r.user_email || "Удалённый пользователь"
        : type === "group"
          ? r.group_code || "Удалённая группа"
          : type === "course"
            ? r.course_name || "Удалённый курс"
            : ROLE_LABELS[r.role_name] || r.role_name;
    const subtitle =
      type === "user" ? r.user_email : type === "group" ? r.group_course : type === "role" ? "Все пользователи роли" : "Все группы курса";
    const expiresAt = r.expires_at ? new Date(r.expires_at) : null;
    return {
      id: r.id,
      type,
      targetId: r.user_id || r.group_id || r.course_id || r.role_name,
      name,
      subtitle,
      members: Number(r.members) || 0,
      grantedBy: r.granted_by_name,
      grantedAt: r.created_at,
      expiresAt: r.expires_at,
      isExpired: !!expiresAt && expiresAt.getTime() <= now,
      expiresSoon: !!expiresAt && expiresAt.getTime() > now && expiresAt.getTime() - now < 7 * 86400_000,
      readingStats:
        type === "user"
          ? {
              progress: total > 0 ? Math.min(100, Math.round(((r.max_page || 0) / total) * 100)) : 0,
              lastReadAt: r.last_read_at,
              totalSeconds: Number(r.total_seconds) || 0,
            }
          : null,
    };
  });

  return {
    success: true,
    data: {
      bookId,
      bookTitle: book.title,
      accessList,
      totalCount: accessList.length,
      activeCount: accessList.filter((a) => !a.isExpired).length,
      expiredCount: accessList.filter((a) => a.isExpired).length,
    },
  };
});
