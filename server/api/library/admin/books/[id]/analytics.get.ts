import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { roleHasPermission } from "../../../../../utils/permissions";
import { Permission } from "../../../../../types/permissions";
import { getDbPool } from "../../../../../utils/db";
import { RowDataPacket } from "mysql2";

const db = getDbPool();

/**
 * GET /api/library/admin/books/[id]/analytics
 * Получение аналитики по книге
 *
 * Требуемые права: library.manage
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized analytics access by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для просмотра аналитики",
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
    `[Library] Analytics requested for book ${bookId} by user ${user.id}`,
  );

  try {
    // Проверка существования книги
    const [books] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM books WHERE id = ?",
      [bookId],
    );
    const book = books[0];

    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Общая статистика
    const [generalStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(DISTINCT user_id) as unique_readers,
         COUNT(*) as total_sessions,
         SUM(CASE WHEN ended_at IS NULL THEN 1 ELSE 0 END) as active_sessions,
         AVG(CASE WHEN ended_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, ended_at) END) as avg_session_duration,
         MAX(CASE WHEN ended_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, ended_at) END) as max_session_duration,
         MIN(started_at) as first_read_at,
         MAX(started_at) as last_read_at
       FROM book_reading_sessions
       WHERE book_id = ?`,
      [bookId],
    );
    const stats = generalStats[0];

    // Топ читателей (по количеству сессий)
    const [topReaders] = await db.execute<RowDataPacket[]>(
      `SELECT 
         u.id,
         u.name,
         u.email,
         COUNT(*) as sessions_count,
         SUM(CASE WHEN s.ended_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, s.started_at, s.ended_at) ELSE 0 END) as total_time,
         MAX(s.started_at) as last_session_at
       FROM book_reading_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.book_id = ?
       GROUP BY u.id, u.name, u.email
       ORDER BY sessions_count DESC
       LIMIT 10`,
      [bookId],
    );

    // Прогресс чтения пользователей
    const [readingProgress] = await db.execute<RowDataPacket[]>(
      `SELECT 
         u.name,
         p.last_page,
         p.last_read_at as updated_at,
         ROUND((p.last_page / ?) * 100) as progress_percent
       FROM book_reading_progress p
       JOIN users u ON p.user_id = u.id
       WHERE p.book_id = ?
       ORDER BY p.last_page DESC
       LIMIT 10`,
      [book.total_pages, bookId],
    );

    // Динамика чтения по дням (последние 30 дней)
    const [readingDynamics] = await db.execute<RowDataPacket[]>(
      `SELECT 
         DATE(started_at) as date,
         COUNT(DISTINCT user_id) as unique_readers,
         COUNT(*) as sessions_count
       FROM book_reading_sessions
       WHERE book_id = ? AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [bookId],
    );

    // Статистика завершенности чтения
    const [completionStatsResult] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total_readers,
         SUM(CASE WHEN last_page >= ? THEN 1 ELSE 0 END) as completed_readers,
         SUM(CASE WHEN last_page >= ? * 0.5 THEN 1 ELSE 0 END) as half_completed,
         AVG(last_page) as avg_page_reached,
         AVG((last_page / ?) * 100) as avg_progress_percent
       FROM book_reading_progress
       WHERE book_id = ?`,
      [book.total_pages, book.total_pages, book.total_pages, bookId],
    );
    const completionStats = completionStatsResult[0];

    console.log(`[Library] Analytics generated for book ${bookId}`);

    return {
      success: true,
      data: {
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          pageCount: book.total_pages,
        },
        general: {
          uniqueReaders: Number(stats.unique_readers || 0),
          totalSessions: Number(stats.total_sessions || 0),
          activeSessions: Number(stats.active_sessions || 0),
          avgSessionDuration: Math.round(
            Number(stats.avg_session_duration || 0),
          ),
          maxSessionDuration: Number(stats.max_session_duration || 0),
          firstReadAt: stats.first_read_at,
          lastReadAt: stats.last_read_at,
        },
        completion: {
          totalReaders: Number(completionStats?.total_readers || 0),
          completedReaders: Number(completionStats?.completed_readers || 0),
          halfCompleted: Number(completionStats?.half_completed || 0),
          avgPageReached: Math.round(
            Number(completionStats?.avg_page_reached || 0),
          ),
          avgProgressPercent: Math.round(
            Number(completionStats?.avg_progress_percent || 0),
          ),
        },
        topReaders: topReaders.map((reader) => ({
          id: reader.id,
          username: reader.email, // Using email as username for display if username col missing
          fullName: reader.name,
          sessionsCount: reader.sessions_count,
          totalTime: reader.total_time,
          lastSessionAt: reader.last_session_at,
        })),
        readingProgress: readingProgress.map((p) => ({
          username: p.name,
          lastPageRead: p.last_page,
          progressPercent: p.progress_percent,
          updatedAt: p.updated_at,
        })),
        dynamics: readingDynamics.map((d) => ({
          date: d.date,
          uniqueReaders: d.unique_readers,
          sessionsCount: d.sessions_count,
        })),
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to fetch analytics for book ${bookId}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении аналитики",
    });
  }
});
