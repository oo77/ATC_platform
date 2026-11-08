import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import {
  isLibraryStaff,
  accessExistsSql,
  accessMatchSql,
  accessParams,
  clampInt,
} from "../../../utils/libraryAccess";

/**
 * GET /api/library/catalog
 * Каталог книг, доступных текущему пользователю.
 *
 * Query:
 * - page, limit (≤ 48)
 * - search  — название, автор, ISBN
 * - author, language
 * - shelf   — all | reading | completed | unread
 * - sort    — title | recent | added | progress
 *
 * Доступ считается по тем же правилам, что и при открытии книги:
 * личный, по роли, через группу или курс. Раньше каталог не видел
 * доступ через группы/курсы — такие книги можно было открыть, но не найти.
 */
const COMPLETED_SQL = "(brp.completed_at IS NOT NULL OR (b.total_pages > 0 AND brp.max_page >= b.total_pages))";

export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const query = getQuery(event);
  const staff = isLibraryStaff(user);

  const page = clampInt(query.page, 1, 10_000, 1);
  const limit = clampInt(query.limit, 1, 48, 12);
  const offset = (page - 1) * limit;

  // Базовое условие — что пользователь вообще может видеть
  const baseWhere = [`b.status = 'ready'`, `b.deleted_at IS NULL`];
  const baseParams: any[] = [];
  if (!staff) {
    baseWhere.push(accessExistsSql("b"));
    baseParams.push(...accessParams(user));
  }

  // Фильтры пользователя
  const where = [...baseWhere];
  const params: any[] = [...baseParams];

  const search = typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";
  if (search) {
    where.push("(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)");
    const term = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    params.push(term, term, term);
  }
  if (typeof query.author === "string" && query.author) {
    where.push("b.author = ?");
    params.push(query.author.slice(0, 255));
  }
  if (typeof query.language === "string" && query.language) {
    where.push("b.language = ?");
    params.push(query.language.slice(0, 10));
  }

  const shelf = String(query.shelf || "all");
  if (shelf === "reading") where.push(`brp.id IS NOT NULL AND NOT ${COMPLETED_SQL}`);
  else if (shelf === "completed") where.push(`brp.id IS NOT NULL AND ${COMPLETED_SQL}`);
  else if (shelf === "unread") where.push("brp.id IS NULL");

  const sort = String(query.sort || "title");
  const orderBy =
    sort === "added"
      ? "b.created_at DESC, b.title ASC"
      : sort === "recent"
        ? "brp.last_read_at IS NULL, brp.last_read_at DESC, b.title ASC"
        : sort === "progress"
          ? "COALESCE(brp.max_page / NULLIF(b.total_pages, 0), 0) DESC, b.title ASC"
          : "b.title ASC";

  // Срок доступа: NULL — бессрочно (есть хотя бы одна бессрочная запись)
  const expiresSql = staff
    ? "NULL"
    : `(SELECT IF(SUM(ba.expires_at IS NULL) > 0, NULL, MAX(ba.expires_at))
        FROM book_access ba WHERE ba.book_id = b.id AND ${accessMatchSql("ba")})`;
  const expiresParams = staff ? [] : accessParams(user);

  const fromSql = `FROM books b
    LEFT JOIN book_reading_progress brp ON brp.book_id = b.id AND brp.user_id = ?`;

  const rows = await executeQuery<any[]>(
    `SELECT b.id, b.title, b.author, b.description, b.isbn, b.language, b.category,
            b.published_year, b.total_pages, b.cover_path, b.created_at,
            brp.last_page, brp.max_page, brp.last_read_at, brp.completed_at, brp.total_seconds,
            ${expiresSql} AS access_expires_at
     ${fromSql}
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    [...expiresParams, user.id, ...params],
  );

  const [countRow] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS total ${fromSql} WHERE ${where.join(" AND ")}`,
    [user.id, ...params],
  );

  // Сводка по «полкам» — без пользовательских фильтров
  const [summaryRow] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS available,
            SUM(brp.id IS NOT NULL AND NOT ${COMPLETED_SQL}) AS reading,
            SUM(brp.id IS NOT NULL AND ${COMPLETED_SQL}) AS completed,
            COALESCE(SUM(brp.total_seconds), 0) AS total_seconds
     ${fromSql}
     WHERE ${baseWhere.join(" AND ")}`,
    [user.id, ...baseParams],
  );

  // «Продолжить чтение» — последние начатые и не дочитанные книги
  let continueReading: any[] = [];
  if (page === 1) {
    continueReading = await executeQuery<any[]>(
      `SELECT b.id, b.title, b.author, b.total_pages, b.cover_path,
              brp.last_page, brp.max_page, brp.last_read_at
       ${fromSql}
       WHERE ${baseWhere.join(" AND ")} AND brp.id IS NOT NULL AND NOT ${COMPLETED_SQL}
       ORDER BY brp.last_read_at DESC
       LIMIT 3`,
      [user.id, ...baseParams],
    );
  }

  const NEW_MS = 14 * 24 * 3600 * 1000;
  const mapBook = (b: any) => {
    const total = Number(b.total_pages) || 0;
    const last = Number(b.last_page) || 0;
    const max = Math.max(Number(b.max_page) || 0, last);
    const completed = !!b.completed_at || (total > 0 && max >= total);
    return {
      id: b.id,
      title: b.title,
      author: b.author,
      description: b.description,
      isbn: b.isbn,
      language: b.language,
      category: b.category,
      published_year: b.published_year,
      total_pages: total,
      cover_url: b.cover_path ? `/api/library/covers/${b.id}` : null,
      isNew: b.created_at ? Date.now() - new Date(b.created_at).getTime() < NEW_MS : false,
      expiresAt: b.access_expires_at || null,
      progress: {
        current_page: last,
        max_page: max,
        total_pages: total,
        percentage: total > 0 ? Math.min(100, Math.round((max / total) * 100)) : 0,
        lastReadAt: b.last_read_at || null,
        completed,
        totalSeconds: Number(b.total_seconds) || 0,
      },
    };
  };

  return {
    books: rows.map(mapBook),
    total: Number(countRow?.total || 0),
    summary: {
      available: Number(summaryRow?.available || 0),
      reading: Number(summaryRow?.reading || 0),
      completed: Number(summaryRow?.completed || 0),
      totalSeconds: Number(summaryRow?.total_seconds || 0),
    },
    continueReading: continueReading.map(mapBook),
  };
});
