import { defineEventHandler, getQuery, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import { roleHasPermission, Permission } from "../../../utils/permissions";

/**
 * GET /api/library/catalog
 * Получение каталога книг, доступных текущему пользователю
 *
 * Query параметры:
 * - search?: поиск по названию/автору
 * - category?: фильтр по категории
 * - language?: фильтр по языку
 * - sortBy?: поле сортировки (title|author|created_at)
 * - sortOrder?: порядок сортировки (asc|desc)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  const query = getQuery(event);

  console.log(`[Library] Catalog requested by user ${user.id} (${user.email})`);

  try {
    // Параметры пагинации
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.max(1, parseInt(query.limit as string) || 12);
    const offset = (page - 1) * limit;

    // Проверка прав доступа: если админ, показываем все книги
    const isAdmin = roleHasPermission(user.role, Permission.LIBRARY_MANAGE);

    // Базовый WHERE clause
    let whereClause = "";
    const whereParams: any[] = [];

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

    // Применение фильтров
    if (query.search) {
      whereClause +=
        " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)";
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

    // Оптимизированный запрос: объединяем COUNT и SELECT, используем LEFT JOIN вместо подзапросов
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

    // Сортировка
    const sortBy = (query.sortBy as string) || "title";
    const sortOrder = (query.sortOrder as string) === "desc" ? "desc" : "asc";

    const allowedSortFields = ["title", "author", "created_at"];
    if (allowedSortFields.includes(sortBy)) {
      sql += ` ORDER BY b.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      sql += ` ORDER BY b.title ASC`;
    }

    // Пагинация
    sql += " LIMIT ? OFFSET ?";

    // Параметры выборки: user_id для LEFT JOIN + where params + limit + offset
    const selectParams = [user.id, ...whereParams, limit, offset];

    // Выполняем запрос книг
    const books = await executeQuery<any[]>(sql, selectParams);

    // Подсчет общего количества (отдельный легковесный запрос)
    const countSql = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM books b
      ${isAdmin ? "" : "INNER JOIN book_access ba ON b.id = ba.book_id"}
      WHERE ${whereClause}
    `;

    const [countResult] = await executeQuery<any[]>(countSql, whereParams);
    const totalCount = Number(countResult?.total || 0);

    console.log(
      `[Library] Catalog returned ${books.length} books (page ${page}/${Math.ceil(totalCount / limit)}, total: ${totalCount}) for user ${user.id}`,
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
          percentage:
            book.total_pages > 0
              ? Math.round(
                  ((book.last_page_read || 0) / book.total_pages) * 100,
                )
              : 0,
          lastReadAt: book.last_read_at,
        },
      })),
      total: totalCount,
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to fetch catalog for user ${user.id}:`,
      error,
    );
    throw createError({
      statusCode: 500,
      message: `Ошибка при получении каталога книг: ${error.message}`,
    });
  }
});
