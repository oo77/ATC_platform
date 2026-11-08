import { defineEventHandler, createError, getQuery, appendHeader } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { roleHasPermission, Permission } from "../../../../utils/permissions";
import { executeQuery } from "../../../../utils/db";
import { logActivity } from "../../../../utils/activityLogger";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const XLSX = require("xlsx");
  const query = getQuery(event);

  // Проверка прав доступа
  if (!roleHasPermission(user, Permission.LIBRARY_MANAGE)) {
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

    if (query.author) {
      whereClauses.push("books.author LIKE ?");
      params.push(`%${String(query.author).slice(0, 255)}%`);
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
        (SELECT COUNT(*) FROM book_reading_progress p WHERE p.book_id = books.id) as readers_count,
        (SELECT COUNT(*) FROM book_reading_progress p WHERE p.book_id = books.id
           AND (p.completed_at IS NOT NULL OR (books.total_pages > 0 AND p.max_page >= books.total_pages))) as completed_count,
        (SELECT COALESCE(SUM(p.total_seconds), 0) FROM book_reading_progress p WHERE p.book_id = books.id) as reading_seconds
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
      Описание: book.description || "—",
      ISBN: book.isbn || "—",
      Категория: book.category || "—",
      Язык: book.language || "—",
      "Год издания": book.published_year || "—",
      Страниц: book.total_pages || book.page_count || 0,
      "Размер файла (КБ)": book.file_size_bytes
        ? Math.round(book.file_size_bytes / 1024)
        : 0,
      Статус: ({ ready: "Готова", processing: "Обработка", error: "Ошибка" } as Record<string, string>)[book.status] || book.status,
      Загрузил: book.uploaded_by_username || "Неизвестно",
      "Дата загрузки": book.created_at
        ? new Date(book.created_at).toLocaleDateString()
        : "—",
      Доступов: book.access_count || 0,
      Читателей: Number(book.readers_count) || 0,
      Дочитали: Number(book.completed_count) || 0,
      "Время чтения (ч)": Math.round((Number(book.reading_seconds) || 0) / 360) / 10,
    }));

    // Создание книги Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Настройка ширины колонок
    const wscols = [
      { wch: 36 }, // ID
      { wch: 40 }, // Название
      { wch: 20 }, // Автор
      { wch: 50 }, // Описание
      { wch: 15 }, // ISBN
      { wch: 15 }, // Категория
      { wch: 10 }, // Язык
      { wch: 12 }, // Год издания
      { wch: 10 }, // Страниц
      { wch: 18 }, // Размер файла (КБ)
      { wch: 10 }, // Статус
      { wch: 20 }, // Загрузил
      { wch: 15 }, // Дата
      { wch: 10 }, // Доступов
      { wch: 10 }, // Читателей
      { wch: 10 }, // Дочитали
      { wch: 16 }, // Время чтения
    ];
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Books");

    await logActivity(event, "EXPORT", "LIBRARY_BOOK", undefined, `Экспорт ${books.length} книг`, {
      action: "export_books",
      filters: { search: query.search, status: query.status, language: query.language, author: query.author },
    });

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
