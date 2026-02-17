import { c as roleHasPermission, P as Permission } from '../../../../../../_/permissions.mjs';
import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../../_/nitro.mjs';
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
const index_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized access list view by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0441\u043F\u0438\u0441\u043A\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
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
    `[Library] Access list requested for book ${bookId} by user ${user.id}`
  );
  try {
    const [books] = await db.execute(
      "SELECT * FROM books WHERE id = ? LIMIT 1",
      [bookId]
    );
    const book = books[0];
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const [accessList] = await db.execute(
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
      [bookId, bookId, bookId]
    );
    console.log(
      `[Library] Found ${accessList.length} access records for book ${bookId}`
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
            user: isRole ? null : {
              id: access.user_id,
              username: access.email,
              email: access.email,
              fullName: access.name
            },
            grantedBy: access.granted_by_username,
            grantedAt: access.granted_at,
            expiresAt: access.expires_at,
            isActive: !access.expires_at || new Date(access.expires_at) > /* @__PURE__ */ new Date(),
            isExpired: access.expires_at && new Date(access.expires_at) <= /* @__PURE__ */ new Date(),
            readingStats: isRole ? null : {
              sessionsCount: access.sessions_count || 0,
              lastPageRead: access.last_page_read || 0,
              lastReadAt: access.last_read_at,
              progress: book.total_pages > 0 ? Math.round(
                (access.last_page_read || 0) / book.total_pages * 100
              ) : 0
            }
          };
        }),
        totalCount: accessList.length,
        activeCount: accessList.filter(
          (a) => !a.expires_at || new Date(a.expires_at) > /* @__PURE__ */ new Date()
        ).length,
        expiredCount: accessList.filter(
          (a) => a.expires_at && new Date(a.expires_at) <= /* @__PURE__ */ new Date()
        ).length
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to fetch access list for book ${bookId}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
