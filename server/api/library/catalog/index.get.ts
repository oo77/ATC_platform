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

  console.log(
    `[Library] Catalog requested by user ${user.id} (${user.email}), role: ${user.role}`,
  );

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
      // ИСПРАВЛЕНИЕ: Проверяем доступ по user_id ИЛИ по role_name пользователя.
      // Ранее использовался INNER JOIN только по user_id, что приводило к тому,
      // что книги, выданные через роль, не отображались у студентов/преподавателей.
      whereClause = `
        b.status = 'ready'
        AND b.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM book_access ba
          WHERE ba.book_id = b.id
            AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
            AND (
              ba.user_id = ?
              OR ba.role_name = ?
            )
        )
      `;
      whereParams.push(user.id, user.role);
    }

    // Применение фильтров
    if (query.author) {
      whereClause += " AND b.author = ?";
      whereParams.push(query.author);
      console.log(`[Library] Applied author filter: "${query.author}"`);
    }
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

    // Subquery для получения даты выдачи доступа конкретного пользователя
    // (приоритет у персонального доступа над ролевым)
    const accessSubquery = isAdmin
      ? "NULL"
      : `(SELECT ba2.created_at FROM book_access ba2 WHERE ba2.book_id = b.id AND ba2.user_id = ? ORDER BY ba2.created_at DESC LIMIT 1)`;
    const expiresSubquery = isAdmin
      ? "NULL"
      : `(SELECT ba2.expires_at FROM book_access ba2 WHERE ba2.book_id = b.id AND ba2.user_id = ? ORDER BY ba2.created_at DESC LIMIT 1)`;

    // Основной запрос — LEFT JOIN для прогресса чтения
    let sql = `
      SELECT 
        b.id, b.title, b.author, b.description, b.isbn, 
        NULL as publisher, b.published_year as published_year, 
        b.language, b.category, b.is_published, b.cover_path,
        b.total_pages, b.created_at,
        ${accessSubquery} as granted_at, 
        ${expiresSubquery} as expires_at,
        COALESCE(brp.last_page, 0) as last_page_read,
        brp.last_read_at
      FROM books b
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

    // Параметры для основного SELECT:
    // Для isAdmin:   [user.id (brp LEFT JOIN), ...whereParams, limit, offset]
    // Для !isAdmin:  [user.id (subq granted_at), user.id (subq expires_at), user.id (brp LEFT JOIN), user.id (EXISTS), user.role (EXISTS), ...остальные фильтры, limit, offset]
    let selectParams: any[];
    if (isAdmin) {
      selectParams = [user.id, ...whereParams, limit, offset];
    } else {
      // whereParams уже содержит [user.id, user.role] + фильтры
      selectParams = [user.id, user.id, user.id, ...whereParams, limit, offset];
    }

    // Выполняем запрос книг
    const books = await executeQuery<any[]>(sql, selectParams);

    // Подсчет общего количества (отдельный легковесный запрос без subqueries)
    const countSql = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM books b
      WHERE ${whereClause}
    `;

    const [countResult] = await executeQuery<any[]>(countSql, whereParams);
    const totalCount = Number(countResult?.total || 0);

    console.log(
      `[Library] Catalog returned ${books.length} books (page ${page}/${Math.ceil(totalCount / limit)}, total: ${totalCount}) for user ${user.id} (role: ${user.role})`,
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
        published_year: book.published_year,
        total_pages: book.total_pages,
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
