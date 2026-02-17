import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../_/permissions.mjs';
import { g as getBookById, b as getBookPages } from '../../../../../_/libraryRepository.mjs';
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

const db = getDbPool();
const index_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized book details access by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u043A\u043D\u0438\u0433\u0438"
    });
  }
  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  console.log(
    `[Library] Book details requested: ID ${bookId} by user ${user.id}`
  );
  try {
    const book = await getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const pages = await getBookPages(bookId);
    const [accessList] = await db.execute(
      `SELECT ba.*, u.username, u.email, gbu.username as granted_by_username
       FROM book_access ba
       LEFT JOIN users u ON ba.user_id = u.id
       LEFT JOIN users gbu ON ba.granted_by = gbu.id
       WHERE ba.book_id = ?`,
      [bookId]
    );
    const [statsResult] = await db.execute(
      `SELECT 
         COUNT(DISTINCT user_id) as unique_readers,
         COUNT(*) as total_sessions,
         AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_session_duration,
         SUM(CASE WHEN ended_at IS NULL THEN 1 ELSE 0 END) as active_sessions
       FROM book_reading_sessions
       WHERE book_id = ?`,
      [bookId]
    );
    const stats = statsResult[0];
    console.log(
      `[Library] Book ${bookId} details loaded: ${pages.length} pages, ${accessList.length} access grants`
    );
    return {
      success: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        // publisher: book.publisher,
        // publishedYear: book.published_year,
        // language: book.language,
        category: book.category,
        pageCount: book.total_pages,
        fileSize: book.file_size_bytes,
        coverPath: book.cover_path,
        processingStatus: book.status,
        errorMessage: book.processing_error,
        uploadedBy: book.uploaded_by,
        createdAt: book.created_at,
        processedAt: null,
        // No processed_at field in interface, using updated_at
        pages: pages.map((p) => ({
          id: p.id,
          pageNumber: p.page_number,
          width: p.width,
          height: p.height
        })),
        access: accessList.map((a) => ({
          userId: a.user_id,
          username: a.username,
          email: a.email,
          grantedBy: {
            id: a.granted_by,
            username: a.granted_by_username
          },
          grantedAt: a.granted_at,
          expiresAt: a.expires_at,
          isActive: !a.expires_at || new Date(a.expires_at) > /* @__PURE__ */ new Date()
        })),
        statistics: {
          uniqueReaders: stats?.unique_readers || 0,
          totalSessions: stats?.total_sessions || 0,
          avgSessionDuration: stats?.avg_session_duration || 0,
          activeSessions: stats?.active_sessions || 0
        }
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to fetch book details for ID ${bookId}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u043A\u043D\u0438\u0433\u0438"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
