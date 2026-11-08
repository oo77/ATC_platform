import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { executeQuery } from "../../../../utils/db";
import { requireLibraryPermission, clampInt, activeSessionSql } from "../../../../utils/libraryAccess";

/**
 * GET /api/library/admin/books
 * Список книг для панели управления.
 *
 * Query: page, limit (≤100), search, author, language, status (ready|processing|failed),
 *        access (none — книги без единой записи доступа),
 *        sortBy (created_at|title|author|total_pages|readers|last_read), sortOrder (asc|desc)
 */
const SORT: Record<string, string> = {
  created_at: "b.created_at",
  title: "b.title",
  author: "b.author",
  total_pages: "b.total_pages",
  readers: "readers_count",
  last_read: "last_read_at",
};

export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user);

  const query = getQuery(event);
  const page = clampInt(query.page, 1, 10_000, 1);
  const limit = clampInt(query.limit, 1, 100, 20);
  const offset = (page - 1) * limit;

  const where: string[] = ["b.deleted_at IS NULL"];
  const params: any[] = [];

  const search = typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";
  if (search) {
    const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    where.push("(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)");
    params.push(term, term, term);
  }
  if (typeof query.author === "string" && query.author) {
    where.push("b.author LIKE ?");
    params.push(`%${query.author.slice(0, 255).replace(/[%_\\]/g, "\\$&")}%`);
  }
  if (typeof query.language === "string" && query.language) {
    where.push("b.language = ?");
    params.push(query.language.slice(0, 10));
  }
  if (typeof query.status === "string" && query.status) {
    where.push("b.status = ?");
    params.push(query.status === "failed" ? "error" : query.status);
  }
  if (query.access === "none") {
    where.push("NOT EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = b.id)");
  }

  const sortField = SORT[String(query.sortBy)] || SORT.created_at;
  const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC";
  const whereSql = where.join(" AND ");

  const [countRow] = await executeQuery<any[]>(`SELECT COUNT(*) AS total FROM books b WHERE ${whereSql}`, params);

  const [statsRow] = await executeQuery<any[]>(
    `SELECT
       SUM(status = 'ready') AS ready,
       SUM(status = 'processing') AS processing,
       SUM(status = 'error') AS failed,
       SUM(NOT EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = books.id)) AS without_access
     FROM books WHERE deleted_at IS NULL`,
  );

  const rows = await executeQuery<any[]>(
    `SELECT b.*, u.name AS uploaded_by_name,
       (SELECT COUNT(*) FROM book_access ba WHERE ba.book_id = b.id) AS access_count,
       (SELECT COUNT(*) FROM book_reading_progress p WHERE p.book_id = b.id) AS readers_count,
       (SELECT COUNT(*) FROM book_reading_progress p WHERE p.book_id = b.id
          AND (p.completed_at IS NOT NULL OR (b.total_pages > 0 AND p.max_page >= b.total_pages))) AS completed_count,
       (SELECT COUNT(DISTINCT s.user_id) FROM book_reading_sessions s WHERE s.book_id = b.id AND ${activeSessionSql("s")}) AS reading_now,
       (SELECT MAX(p.last_read_at) FROM book_reading_progress p WHERE p.book_id = b.id) AS last_read_at
     FROM books b
     LEFT JOIN users u ON u.id = b.uploaded_by
     WHERE ${whereSql}
     ORDER BY ${sortField} ${sortOrder}, b.title ASC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const total = Number(countRow?.total || 0);
  return {
    books: rows.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      description: b.description || null,
      isbn: b.isbn,
      language: b.language,
      category: b.category,
      published_year: b.published_year,
      total_pages: b.total_pages || 0,
      file_size: Number(b.file_size_bytes) || 0,
      cover_url: b.cover_path ? `/api/library/covers/${b.id}` : null,
      status: b.status === "error" ? "failed" : b.status,
      errorMessage: b.processing_error || null,
      uploadedBy: b.uploaded_by_name || null,
      created_at: b.created_at,
      access_count: Number(b.access_count) || 0,
      readers_count: Number(b.readers_count) || 0,
      completed_count: Number(b.completed_count) || 0,
      reading_now: Number(b.reading_now) || 0,
      last_read_at: b.last_read_at || null,
    })),
    total,
    stats: {
      ready: Number(statsRow?.ready || 0),
      processing: Number(statsRow?.processing || 0),
      failed: Number(statsRow?.failed || 0),
      withoutAccess: Number(statsRow?.without_access || 0),
    },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
});
