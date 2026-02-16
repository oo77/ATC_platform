import { roleHasPermission } from "../../../../../../utils/permissions";
import { Permission } from "../../../../../../types/permissions";
import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import { getDbPool } from "../../../../../../utils/db";

const db = getDbPool();
/**
 * GET /api/library/admin/books/[id]/access
 * Получение списка пользователей с доступом к книге
 *
 * Требуемые права: library.manage
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized access list view by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для просмотра списка доступа",
    });
  }

  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  console.log(
    `[Library] Access list requested for book ${bookId} by user ${user.id}`,
  );

  try {
    // Проверка существования книги
    const [books] = await db.execute<any[]>(
      "SELECT * FROM books WHERE id = ? LIMIT 1",
      [bookId],
    );
    const book = books[0];
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Получение списка доступов с дополнительной информацией
    const [accessList] = await db.execute<any[]>(
      `SELECT 
        ba.id,
        ba.user_id,
        ba.role_name,
        ba.created_at as granted_at,
        ba.expires_at,
        u.name,
        u.email,
        gbu.name as granted_by_username,
        COUNT(DISTINCT brs.id) as sessions_count,
        MAX(brp.last_page) as last_page_read,
        MAX(brp.last_read_at) as last_read_at
      FROM book_access ba
      LEFT JOIN users u ON ba.user_id = u.id
      LEFT JOIN users gbu ON ba.granted_by = gbu.id
      LEFT JOIN book_reading_sessions brs ON brs.book_id = ? AND brs.user_id = ba.user_id
      LEFT JOIN book_reading_progress brp ON brp.book_id = ? AND brp.user_id = ba.user_id
      WHERE ba.book_id = ?
      GROUP BY ba.id, ba.user_id, ba.role_name, ba.created_at, ba.expires_at, u.name, u.email, gbu.name
      ORDER BY ba.created_at DESC`,
      [bookId, bookId, bookId],
    );

    console.log(
      `[Library] Found ${accessList.length} access records for book ${bookId}`,
    );

    return {
      success: true,
      data: {
        bookId,
        bookTitle: book.title,
        accessList: accessList.map((access) => {
          const isRole = !!access.role_name;
          return {
            id: access.id,
            type: isRole ? "role" : "user",
            name: isRole ? access.role_name : access.name || access.email,
            role_name: access.role_name,
            user_id: access.user_id,
            user: isRole
              ? null
              : {
                  id: access.user_id,
                  username: access.email,
                  email: access.email,
                  fullName: access.name,
                },
            grantedBy: access.granted_by_username,
            grantedAt: access.granted_at,
            expiresAt: access.expires_at,
            isActive:
              !access.expires_at || new Date(access.expires_at) > new Date(),
            isExpired:
              access.expires_at && new Date(access.expires_at) <= new Date(),
            readingStats: isRole
              ? null
              : {
                  sessionsCount: access.sessions_count || 0,
                  lastPageRead: access.last_page_read || 0,
                  lastReadAt: access.last_read_at,
                  progress:
                    book.total_pages > 0
                      ? Math.round(
                          ((access.last_page_read || 0) / book.total_pages) *
                            100,
                        )
                      : 0,
                },
          };
        }),
        totalCount: accessList.length,
        activeCount: accessList.filter(
          (a) => !a.expires_at || new Date(a.expires_at) > new Date(),
        ).length,
        expiredCount: accessList.filter(
          (a) => a.expires_at && new Date(a.expires_at) <= new Date(),
        ).length,
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to fetch access list for book ${bookId}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении списка доступа",
    });
  }
});
