import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { roleHasPermission } from "../../../../../utils/permissions";
import { Permission } from "../../../../../types/permissions";
import * as libraryRepository from "../../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../../utils/db";
import { RowDataPacket } from "mysql2";

const db = getDbPool();

/**
 * GET /api/library/admin/books/[id]
 * Получение детальной информации о книге
 *
 * Требуемые права: library.manage
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized book details access by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для просмотра деталей книги",
    });
  }

  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  console.log(
    `[Library] Book details requested: ID ${bookId} by user ${user.id}`,
  );

  try {
    const book = await libraryRepository.getBookById(bookId);

    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Получение дополнительной информации
    const pages = await libraryRepository.getBookPages(bookId);

    // Получение прав доступа
    const [accessList] = await db.execute<RowDataPacket[]>(
      `SELECT ba.*, u.username, u.email, gbu.username as granted_by_username
       FROM book_access ba
       LEFT JOIN users u ON ba.user_id = u.id
       LEFT JOIN users gbu ON ba.granted_by = gbu.id
       WHERE ba.book_id = ?`,
      [bookId],
    );

    // Статистика чтения
    const [statsResult] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(DISTINCT user_id) as unique_readers,
         COUNT(*) as total_sessions,
         AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_session_duration,
         SUM(CASE WHEN ended_at IS NULL THEN 1 ELSE 0 END) as active_sessions
       FROM book_reading_sessions
       WHERE book_id = ?`,
      [bookId],
    );
    const stats = statsResult[0];

    console.log(
      `[Library] Book ${bookId} details loaded: ${pages.length} pages, ${accessList.length} access grants`,
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
        processedAt: null, // No processed_at field in interface, using updated_at

        pages: pages.map((p) => ({
          id: p.id,
          pageNumber: p.page_number,
          width: p.width,
          height: p.height,
        })),
        access: accessList.map((a) => ({
          userId: a.user_id,
          username: a.username,
          email: a.email,
          grantedBy: {
            id: a.granted_by,
            username: a.granted_by_username,
          },
          grantedAt: a.granted_at,
          expiresAt: a.expires_at,
          isActive: !a.expires_at || new Date(a.expires_at) > new Date(),
        })),
        statistics: {
          uniqueReaders: stats?.unique_readers || 0,
          totalSessions: stats?.total_sessions || 0,
          avgSessionDuration: stats?.avg_session_duration || 0,
          activeSessions: stats?.active_sessions || 0,
        },
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to fetch book details for ID ${bookId}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении деталей книги",
    });
  }
});
