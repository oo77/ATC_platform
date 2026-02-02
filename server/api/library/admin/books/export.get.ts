import { defineEventHandler, createError, getQuery, appendHeader } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { roleHasPermission, Permission } from "../../../../utils/permissions";
import { executeQuery } from "../../../../utils/db";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const XLSX = require("xlsx");
  const query = getQuery(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для экспорта",
    });
  }

  // ... остальной код
  try {
    // Построение SQL запроса с фильтрами (аналогично index.get.ts)
    let whereClauses: string[] = ["books.deleted_at IS NULL"];
    let params: any[] = [];

    if (query.search) {
      whereClauses.push(
        "(books.title LIKE ? OR books.author LIKE ? OR books.isbn LIKE ?)",
      );
      const searchTerm = `%${query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (query.category) {
      whereClauses.push("books.category = ?");
      params.push(query.category);
    }

    if (query.language) {
      whereClauses.push("books.language = ?");
      params.push(query.language);
    }

    if (query.status) {
      const dbStatus = query.status === "failed" ? "error" : query.status;
      whereClauses.push("books.status = ?");
      params.push(dbStatus);
    }

    const whereClause = `WHERE ${whereClauses.join(" AND ")}`;

    const booksQuery = `
      SELECT 
        books.*,
        users.name as uploaded_by_username,
        (SELECT COUNT(*) FROM book_access WHERE book_id = books.id) as access_count,
        (SELECT COUNT(DISTINCT user_id) FROM book_reading_sessions WHERE book_id = books.id) as readers_count
      FROM books
      LEFT JOIN users ON books.uploaded_by = users.id
      ${whereClause}
      ORDER BY books.created_at DESC
    `;

    const books = await executeQuery<any[]>(booksQuery, params);

    // Подготовка данных для Excel
    const data = books.map((book) => ({
      ID: book.id,
      Название: book.title,
      Автор: book.author || "—",
      ISBN: book.isbn || "—",
      Категория: book.category || "—",
      Язык: book.language || "—",
      Страниц: book.total_pages || book.page_count || 0,
      Статус: book.status,
      Загрузил: book.uploaded_by_username || "Неизвестно",
      "Дата загрузки": book.created_at
        ? new Date(book.created_at).toLocaleDateString()
        : "—",
      Читателей: book.readers_count || 0,
    }));

    // Создание книги Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Настройка ширины колонок
    const wscols = [
      { wch: 36 }, // ID
      { wch: 40 }, // Название
      { wch: 20 }, // Автор
      { wch: 15 }, // ISBN
      { wch: 15 }, // Категория
      { wch: 10 }, // Язык
      { wch: 10 }, // Страниц
      { wch: 10 }, // Статус
      { wch: 20 }, // Загрузил
      { wch: 15 }, // Дата
      { wch: 10 }, // Читателей
    ];
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Books");

    // Генерация буфера
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Установка заголовков для скачивания
    appendHeader(
      event,
      "Content-Disposition",
      'attachment; filename="library_books.xlsx"',
    );
    appendHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    return buf;
  } catch (error) {
    console.error(`[Library] Failed to export books:`, error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при экспорте книг",
    });
  }
});
