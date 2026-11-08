import { defineEventHandler, createError, getQuery } from "h3";
import { requireAuth } from "../../../../../utils/auth";
import { executeQuery } from "../../../../../utils/db";
import {
  requireLibraryPermission,
  closeStaleSessions,
  activeSessionSql,
  ROLE_LABELS,
} from "../../../../../utils/libraryAccess";
import { dailySeries, parsePeriodDays, COMPLETED_SQL } from "../../../../../utils/libraryStats";

/**
 * GET /api/library/admin/books/[id]/analytics?days=30
 * Аналитика книги: читатели, реальное время чтения (по heartbeat, а не по
 * времени открытой вкладки), дочитываемость, динамика и последние сессии.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user);

  const bookId = event.context.params?.id;
  if (!bookId) throw createError({ statusCode: 400, message: "Некорректный ID книги" });
  const days = parsePeriodDays(getQuery(event).days);

  const [book] = await executeQuery<any[]>(
    "SELECT id, title, author, total_pages, created_at FROM books WHERE id = ? LIMIT 1",
    [bookId],
  );
  if (!book) throw createError({ statusCode: 404, message: "Книга не найдена" });

  await closeStaleSessions(bookId);
  const total = Number(book.total_pages) || 0;

  const [readerStats] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS readers,
            SUM(${COMPLETED_SQL("p", "b")}) AS completed,
            AVG(LEAST(p.max_page / NULLIF(b.total_pages, 0), 1)) * 100 AS avg_progress,
            COALESCE(SUM(p.total_seconds), 0) AS seconds,
            SUM(p.max_page < 0.25 * b.total_pages) AS b0,
            SUM(p.max_page >= 0.25 * b.total_pages AND p.max_page < 0.5 * b.total_pages) AS b1,
            SUM(p.max_page >= 0.5 * b.total_pages AND p.max_page < 0.75 * b.total_pages) AS b2,
            SUM(p.max_page >= 0.75 * b.total_pages AND NOT ${COMPLETED_SQL("p", "b")}) AS b3
     FROM book_reading_progress p JOIN books b ON b.id = p.book_id
     WHERE p.book_id = ?`,
    [bookId],
  );

  const [sessionStats] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS sessions,
            COALESCE(SUM(s.pages_viewed), 0) AS pages_viewed,
            SUM(${activeSessionSql("s")}) AS reading_now,
            SUM(s.started_at >= CURDATE() - INTERVAL ? DAY) AS period_sessions,
            COUNT(DISTINCT IF(s.started_at >= CURDATE() - INTERVAL ? DAY, s.user_id, NULL)) AS period_readers
     FROM book_reading_sessions s WHERE s.book_id = ?`,
    [days - 1, days - 1, bookId],
  );

  const readers = await executeQuery<any[]>(
    `SELECT u.id, u.name, u.email, u.role,
            p.last_page, p.max_page, p.total_seconds, p.first_read_at, p.last_read_at, p.completed_at,
            (SELECT COUNT(*) FROM book_reading_sessions s WHERE s.book_id = p.book_id AND s.user_id = p.user_id) AS sessions,
            EXISTS (SELECT 1 FROM book_reading_sessions s WHERE s.book_id = p.book_id AND s.user_id = p.user_id AND ${activeSessionSql("s")}) AS reading_now
     FROM book_reading_progress p
     JOIN users u ON u.id = p.user_id
     WHERE p.book_id = ?
     ORDER BY p.last_read_at DESC
     LIMIT 100`,
    [bookId],
  );

  const sessions = await executeQuery<any[]>(
    `SELECT s.id, u.name, s.started_at, s.ended_at, s.last_activity_at, s.active_seconds, s.pages_viewed, s.current_page,
            ${activeSessionSql("s")} AS is_active
     FROM book_reading_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.book_id = ?
     ORDER BY s.started_at DESC
     LIMIT 20`,
    [bookId],
  );

  const daily = await dailySeries(days, bookId);
  const readersCount = Number(readerStats?.readers || 0);
  const completed = Number(readerStats?.completed || 0);
  const seconds = Number(readerStats?.seconds || 0);
  const pct = (page: number) => (total > 0 ? Math.min(100, Math.round((page / total) * 100)) : 0);

  return {
    book: { id: book.id, title: book.title, author: book.author, totalPages: total },
    days,
    summary: {
      readers: readersCount,
      completed,
      completionRate: readersCount ? Math.round((completed / readersCount) * 100) : 0,
      averageProgress: Math.round(Number(readerStats?.avg_progress || 0)),
      totalSeconds: seconds,
      avgSecondsPerReader: readersCount ? Math.round(seconds / readersCount) : 0,
      sessions: Number(sessionStats?.sessions || 0),
      pagesViewed: Number(sessionStats?.pages_viewed || 0),
      readingNow: Number(sessionStats?.reading_now || 0),
      periodSessions: Number(sessionStats?.period_sessions || 0),
      periodReaders: Number(sessionStats?.period_readers || 0),
    },
    distribution: [
      { label: "До 25%", value: Number(readerStats?.b0 || 0) },
      { label: "25–50%", value: Number(readerStats?.b1 || 0) },
      { label: "50–75%", value: Number(readerStats?.b2 || 0) },
      { label: "75–99%", value: Number(readerStats?.b3 || 0) },
      { label: "Дочитали", value: completed },
    ],
    daily,
    readers: readers.map((r) => ({
      userId: r.id,
      name: r.name,
      email: r.email,
      role: ROLE_LABELS[r.role] || r.role,
      currentPage: r.last_page,
      maxPage: Math.max(r.max_page || 0, r.last_page || 0),
      progress: pct(Math.max(r.max_page || 0, r.last_page || 0)),
      totalSeconds: Number(r.total_seconds) || 0,
      sessions: Number(r.sessions) || 0,
      firstReadAt: r.first_read_at,
      lastReadAt: r.last_read_at,
      completedAt: r.completed_at,
      readingNow: !!r.reading_now,
    })),
    recentSessions: sessions.map((s) => ({
      id: s.id,
      userName: s.name,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      activeSeconds: Number(s.active_seconds) || 0,
      pagesViewed: Number(s.pages_viewed) || 0,
      currentPage: s.current_page,
      isActive: !!s.is_active,
    })),
  };
});
