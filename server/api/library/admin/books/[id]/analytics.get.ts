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
         SUM(CASE WHEN ended_at IS NULL THEN 1 ELSE 0 END) as active_sessions
       FROM book_reading_sessions
       WHERE book_id = ?`,
      [bookId],
    );
    const stats = generalStats[0];

    // Статистика завершенности чтения
    const [completionStatsResult] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total_readers,
         SUM(CASE WHEN last_page >= ? THEN 1 ELSE 0 END) as completed_readers,
         AVG((last_page / ?) * 100) as avg_progress_percent
       FROM book_reading_progress
       WHERE book_id = ?`,
      [book.total_pages, book.total_pages, bookId],
    );
    const completionStats = completionStatsResult[0];

    // Активные читатели (с прогрессом)
    const [activeReadersData] = await db.execute<RowDataPacket[]>(
      `SELECT 
         u.id as userId,
         u.name as userName,
         p.last_page as currentPage,
         ROUND((p.last_page / ?) * 100) as progress,
         p.last_read_at as lastActivity
       FROM book_reading_progress p
       JOIN users u ON p.user_id = u.id
       WHERE p.book_id = ?
       ORDER BY p.last_read_at DESC
       LIMIT 10`,
      [book.total_pages, bookId],
    );

    // Последние сессии чтения
    const [recentSessionsData] = await db.execute<RowDataPacket[]>(
      `SELECT 
         s.id,
         u.name as userName,
         s.started_at as startedAt,
         s.ended_at as endedAt,
         CASE 
           WHEN s.ended_at IS NOT NULL 
           THEN TIMESTAMPDIFF(SECOND, s.started_at, s.ended_at)
           ELSE TIMESTAMPDIFF(SECOND, s.started_at, NOW())
         END as duration
       FROM book_reading_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.book_id = ?
       ORDER BY s.started_at DESC
       LIMIT 20`,
      [bookId],
    );

    console.log(
      `[Library] Analytics generated for book ${bookId} by user ${user.id} (${user.role}):`,
      {
        totalViews: Number(stats.total_sessions || 0),
        uniqueReaders: Number(stats.unique_readers || 0),
        completedReaders: Number(completionStats?.completed_readers || 0),
        averageProgress: Math.round(
          Number(completionStats?.avg_progress_percent || 0),
        ),
      },
    );

    return {
      totalViews: Number(stats.total_sessions || 0),
      uniqueReaders: Number(stats.unique_readers || 0),
      completedReaders: Number(completionStats?.completed_readers || 0),
      averageProgress: Math.round(
        Number(completionStats?.avg_progress_percent || 0),
      ),
      activeReaders: activeReadersData.map((reader) => ({
        userId: reader.userId,
        userName: reader.userName,
        currentPage: reader.currentPage,
        progress: reader.progress,
        lastActivity: reader.lastActivity,
      })),
      recentSessions: recentSessionsData.map((session) => ({
        id: session.id,
        userName: session.userName,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
      })),
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
