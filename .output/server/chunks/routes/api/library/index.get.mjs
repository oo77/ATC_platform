import { g as defineEventHandler, G as requireAuth, i as getQuery, f as executeQuery, h as createError } from '../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../_/permissions.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const query = getQuery(event);
  console.log(`[Library] Catalog requested by user ${user.id} (${user.email})`);
  try {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 12);
    const offset = (page - 1) * limit;
    const isAdmin = roleHasPermission(user.role, Permission.LIBRARY_MANAGE);
    let whereClause = "";
    const whereParams = [];
    if (isAdmin) {
      whereClause = `
        b.status = 'ready'
        AND b.deleted_at IS NULL
      `;
    } else {
      whereClause = `
        ba.user_id = ?
        AND b.status = 'ready'
        AND b.deleted_at IS NULL
        AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
      `;
      whereParams.push(user.id);
    }
    if (query.search) {
      whereClause += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)";
      const searchTerm = `%${query.search}%`;
      whereParams.push(searchTerm, searchTerm, searchTerm);
      console.log(`[Library] Applied search filter: "${query.search}"`);
    }
    if (query.category) {
      whereClause += " AND b.category = ?";
      whereParams.push(query.category);
      console.log(`[Library] Applied category filter: "${query.category}"`);
    }
    if (query.language) {
      whereClause += " AND b.language = ?";
      whereParams.push(query.language);
      console.log(`[Library] Applied language filter: "${query.language}"`);
    }
    let sql = `
      SELECT 
        b.id, b.title, b.author, b.description, b.isbn, 
        NULL as publisher, NULL as published_year, 
        b.language, b.category, b.is_published, b.cover_path,
        b.total_pages, b.created_at,
        ${isAdmin ? "NULL" : "ba.created_at"} as granted_at, 
        ${isAdmin ? "NULL" : "ba.expires_at"} as expires_at,
        COALESCE(brp.last_page, 0) as last_page_read,
        brp.last_read_at
      FROM books b
      ${isAdmin ? "" : "INNER JOIN book_access ba ON b.id = ba.book_id"}
      LEFT JOIN book_reading_progress brp ON b.id = brp.book_id AND brp.user_id = ?
      WHERE ${whereClause}
    `;
    const sortBy = query.sortBy || "title";
    const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";
    const allowedSortFields = ["title", "author", "created_at"];
    if (allowedSortFields.includes(sortBy)) {
      sql += ` ORDER BY b.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      sql += ` ORDER BY b.title ASC`;
    }
    sql += " LIMIT ? OFFSET ?";
    const selectParams = [user.id, ...whereParams, limit, offset];
    const books = await executeQuery(sql, selectParams);
    const countSql = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM books b
      ${isAdmin ? "" : "INNER JOIN book_access ba ON b.id = ba.book_id"}
      WHERE ${whereClause}
    `;
    const [countResult] = await executeQuery(countSql, whereParams);
    const totalCount = Number(countResult?.total || 0);
    console.log(
      `[Library] Catalog returned ${books.length} books (page ${page}/${Math.ceil(totalCount / limit)}, total: ${totalCount}) for user ${user.id}`
    );
    return {
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        language: book.language,
        category: book.category,
        total_pages: book.total_pages,
        // TODO: Создать API endpoint для раздачи обложек
        // Временно возвращаем null, чтобы избежать 404
        cover_url: book.cover_path ? `/api/library/covers/${book.id}` : null,
        grantedAt: book.granted_at,
        expiresAt: book.expires_at,
        progress: {
          current_page: book.last_page_read || 0,
          total_pages: book.total_pages,
          percentage: book.total_pages > 0 ? Math.round(
            (book.last_page_read || 0) / book.total_pages * 100
          ) : 0,
          lastReadAt: book.last_read_at
        }
      })),
      total: totalCount
    };
  } catch (error) {
    console.error(
      `[Library] Failed to fetch catalog for user ${user.id}:`,
      error
    );
    throw createError({
      statusCode: 500,
      message: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430 \u043A\u043D\u0438\u0433: ${error.message}`
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
