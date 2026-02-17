import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { g as defineEventHandler, G as requireAuth, i as getQuery, h as createError, f as executeQuery, K as appendHeader } from '../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../_/permissions.mjs';
import { createRequire } from 'module';
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

const require$1 = createRequire(globalThis._importMeta_.url);
const export_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  const XLSX = require$1("xlsx");
  const query = getQuery(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430"
    });
  }
  try {
    let whereClauses = ["books.deleted_at IS NULL"];
    let params = [];
    if (query.search) {
      whereClauses.push(
        "(books.title LIKE ? OR books.author LIKE ? OR books.isbn LIKE ?)"
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
    const books = await executeQuery(booksQuery, params);
    const data = books.map((book) => ({
      ID: book.id,
      \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435: book.title,
      \u0410\u0432\u0442\u043E\u0440: book.author || "\u2014",
      ISBN: book.isbn || "\u2014",
      \u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F: book.category || "\u2014",
      \u042F\u0437\u044B\u043A: book.language || "\u2014",
      \u0421\u0442\u0440\u0430\u043D\u0438\u0446: book.total_pages || book.page_count || 0,
      \u0421\u0442\u0430\u0442\u0443\u0441: book.status,
      \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u043B: book.uploaded_by_username || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E",
      "\u0414\u0430\u0442\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438": book.created_at ? new Date(book.created_at).toLocaleDateString() : "\u2014",
      \u0427\u0438\u0442\u0430\u0442\u0435\u043B\u0435\u0439: book.readers_count || 0
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    const wscols = [
      { wch: 36 },
      // ID
      { wch: 40 },
      // Название
      { wch: 20 },
      // Автор
      { wch: 15 },
      // ISBN
      { wch: 15 },
      // Категория
      { wch: 10 },
      // Язык
      { wch: 10 },
      // Страниц
      { wch: 10 },
      // Статус
      { wch: 20 },
      // Загрузил
      { wch: 15 },
      // Дата
      { wch: 10 }
      // Читателей
    ];
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Books");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    appendHeader(
      event,
      "Content-Disposition",
      'attachment; filename="library_books.xlsx"'
    );
    appendHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return buf;
  } catch (error) {
    console.error(`[Library] Failed to export books:`, error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435 \u043A\u043D\u0438\u0433"
    });
  }
});

export { export_get as default };
//# sourceMappingURL=export.get.mjs.map
