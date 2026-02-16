import { defineEventHandler, createError, getQuery } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { roleHasPermission, Permission } from "../../../../utils/permissions";
import { executeQuery } from "../../../../utils/db";

/**
 * GET /api/library/admin/books
 * Получение списка всех книг для администратора
 *
 * Требуемые права: library.manage
 *
 * Query параметры:
 * - page?: номер страницы (по умолчанию 1)
 * - limit?: количество на странице (по умолчанию 20)
 * - search?: поиск по названию/автору
 * - category?: фильтр по категории
 * - language?: фильтр по языку
 * - status?: фильтр по статусу обработки (processing|completed|failed)
 * - sortBy?: поле сортировки (created_at|title|author|page_count)
 * - sortOrder?: порядок сортировки (asc|desc)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized books list access by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для просмотра списка книг",
    });
  }

  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = Math.min(parseInt(query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  console.log(
    `[Library] Admin books list requested by user ${user.id}, page ${page}, limit ${limit}`,
  );

  try {
    // Построение SQL запроса с фильтрами
    let whereClauses: string[] = [];
    let params: any[] = [];

    // Применение фильтров
    if (query.search) {
      whereClauses.push(
        "(books.title LIKE ? OR books.author LIKE ? OR books.isbn LIKE ?)",
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
        `[Library] Applied status filter: "${query.status}" (db: ${dbStatus})`,
      );
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as count
      FROM books
      ${whereClause ? whereClause + " AND books.deleted_at IS NULL" : "WHERE books.deleted_at IS NULL"}
    `;
    const countResult = await executeQuery<any[]>(countQuery, params);
    const totalBooks = countResult[0]?.count || 0;

    // Подсчет статистики
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
      FROM books
      WHERE deleted_at IS NULL
    `;
    const statsResult = await executeQuery<any[]>(statsQuery);
    const stats = {
      ready: parseInt(statsResult[0]?.ready || "0"),
      processing: parseInt(statsResult[0]?.processing || "0"),
      failed: parseInt(statsResult[0]?.failed || "0"),
    };

    // Сортировка
    const sortBy = (query.sortBy as string) || "created_at";
    const sortOrder = (query.sortOrder as string) === "asc" ? "ASC" : "DESC";
    const allowedSortFields = ["created_at", "title", "author", "total_pages"];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "created_at";

    // Основной запрос с пагинацией
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

    const books = await executeQuery<any[]>(booksQuery, [
      ...params,
      limit,
      offset,
    ]);

    console.log(
      `[Library] Returned ${books.length} books out of ${totalBooks} total`,
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
          username: book.uploaded_by_username,
        },
        // Extra fields expected by frontend
        total_pages: book.total_pages || book.page_count,
        created_at: book.created_at,
        processedAt: book.processed_at,
      })),
      total: totalBooks,
      stats,
      pagination: {
        page,
        limit,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / limit),
      },
    };
  } catch (error) {
    console.error(`[Library] Failed to fetch books list:`, error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении списка книг",
    });
  }
});
