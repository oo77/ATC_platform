import { g as defineEventHandler, G as requireAuth, h as createError, i as getQuery, f as executeQuery } from '../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../_/permissions.mjs';
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
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized books list access by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0441\u043F\u0438\u0441\u043A\u0430 \u043A\u043D\u0438\u0433"
    });
  }
  const query = getQuery(event);
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  console.log(
    `[Library] Admin books list requested by user ${user.id}, page ${page}, limit ${limit}`
  );
  try {
    let whereClauses = [];
    let params = [];
    if (query.search) {
      whereClauses.push(
        "(books.title LIKE ? OR books.author LIKE ? OR books.isbn LIKE ?)"
      );
      const searchTerm = `%${query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      console.log(`[Library] Applied search filter: "${query.search}"`);
    }
    if (query.category) {
      whereClauses.push("books.category = ?");
      params.push(query.category);
      console.log(`[Library] Applied category filter: "${query.category}"`);
    }
    if (query.language) {
      whereClauses.push("books.language = ?");
      params.push(query.language);
      console.log(`[Library] Applied language filter: "${query.language}"`);
    }
    if (query.status) {
      const dbStatus = query.status === "failed" ? "error" : query.status;
      whereClauses.push("books.status = ?");
      params.push(dbStatus);
      console.log(
        `[Library] Applied status filter: "${query.status}" (db: ${dbStatus})`
      );
    }
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const countQuery = `
      SELECT COUNT(*) as count
      FROM books
      ${whereClause ? whereClause + " AND books.deleted_at IS NULL" : "WHERE books.deleted_at IS NULL"}
    `;
    const countResult = await executeQuery(countQuery, params);
    const totalBooks = countResult[0]?.count || 0;
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
      FROM books
      WHERE deleted_at IS NULL
    `;
    const statsResult = await executeQuery(statsQuery);
    const stats = {
      ready: parseInt(statsResult[0]?.ready || "0"),
      processing: parseInt(statsResult[0]?.processing || "0"),
      failed: parseInt(statsResult[0]?.failed || "0")
    };
    const sortBy = query.sortBy || "created_at";
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC";
    const allowedSortFields = ["created_at", "title", "author", "total_pages"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const booksQuery = `
      SELECT 
        books.*,
        users.name as uploaded_by_username,
        (SELECT COUNT(*) FROM book_access WHERE book_id = books.id) as access_count,
        (SELECT COUNT(DISTINCT user_id) FROM book_reading_sessions WHERE book_id = books.id) as readers_count
      FROM books
      LEFT JOIN users ON books.uploaded_by = users.id
      ${whereClause ? whereClause + " AND books.deleted_at IS NULL" : "WHERE books.deleted_at IS NULL"}
      ORDER BY books.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const books = await executeQuery(booksQuery, [
      ...params,
      limit,
      offset
    ]);
    console.log(
      `[Library] Returned ${books.length} books out of ${totalBooks} total`
    );
    return {
      books: books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description || null,
        isbn: book.isbn,
        publisher: book.publisher,
        publishedYear: book.published_year,
        language: book.language,
        category: book.category,
        pageCount: book.page_count,
        fileSize: book.file_size,
        coverPath: book.cover_path,
        cover_url: book.cover_path ? `/api/library/covers/${book.id}` : null,
        status: book.status === "error" ? "failed" : book.status,
        errorMessage: book.error_message,
        uploadedBy: {
          id: book.uploaded_by,
          username: book.uploaded_by_username
        },
        // Extra fields expected by frontend
        total_pages: book.total_pages || book.page_count,
        created_at: book.created_at,
        processedAt: book.processed_at
      })),
      total: totalBooks,
      stats,
      pagination: {
        page,
        limit,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / limit)
      }
    };
  } catch (error) {
    console.error(`[Library] Failed to fetch books list:`, error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u043A\u043D\u0438\u0433"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
