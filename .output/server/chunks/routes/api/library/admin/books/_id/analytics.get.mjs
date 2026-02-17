import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../../_/permissions.mjs';
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
const analytics_get = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized analytics access by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438"
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
    `[Library] Analytics requested for book ${bookId} by user ${user.id}`
  );
  try {
    const [books] = await db.execute(
      "SELECT * FROM books WHERE id = ?",
      [bookId]
    );
    const book = books[0];
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const [generalStats] = await db.execute(
      `SELECT 
         COUNT(DISTINCT user_id) as unique_readers,
         COUNT(*) as total_sessions,
         SUM(CASE WHEN ended_at IS NULL THEN 1 ELSE 0 END) as active_sessions
       FROM book_reading_sessions
       WHERE book_id = ?`,
      [bookId]
    );
    const stats = generalStats[0];
    const [completionStatsResult] = await db.execute(
      `SELECT 
         COUNT(*) as total_readers,
         SUM(CASE WHEN last_page >= ? THEN 1 ELSE 0 END) as completed_readers,
         AVG((last_page / ?) * 100) as avg_progress_percent
       FROM book_reading_progress
       WHERE book_id = ?`,
      [book.total_pages, book.total_pages, bookId]
    );
    const completionStats = completionStatsResult[0];
    const [activeReadersData] = await db.execute(
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
      [book.total_pages, bookId]
    );
    const [recentSessionsData] = await db.execute(
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
      [bookId]
    );
    console.log(
      `[Library] Analytics generated for book ${bookId} by user ${user.id} (${user.role}):`,
      {
        totalViews: Number(stats.total_sessions || 0),
        uniqueReaders: Number(stats.unique_readers || 0),
        completedReaders: Number(completionStats?.completed_readers || 0),
        averageProgress: Math.round(
          Number(completionStats?.avg_progress_percent || 0)
        )
      }
    );
    return {
      totalViews: Number(stats.total_sessions || 0),
      uniqueReaders: Number(stats.unique_readers || 0),
      completedReaders: Number(completionStats?.completed_readers || 0),
      averageProgress: Math.round(
        Number(completionStats?.avg_progress_percent || 0)
      ),
      activeReaders: activeReadersData.map((reader) => ({
        userId: reader.userId,
        userName: reader.userName,
        currentPage: reader.currentPage,
        progress: reader.progress,
        lastActivity: reader.lastActivity
      })),
      recentSessions: recentSessionsData.map((session) => ({
        id: session.id,
        userName: session.userName,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration
      }))
    };
  } catch (error) {
    console.error(
      `[Library] Failed to fetch analytics for book ${bookId}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438"
    });
  }
});

export { analytics_get as default };
//# sourceMappingURL=analytics.get.mjs.map
