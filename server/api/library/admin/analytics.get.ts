import { defineEventHandler, getQuery } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";
import {
  requireLibraryPermission,
  closeStaleSessions,
  activeSessionSql,
  ROLE_LABELS,
} from "../../../utils/libraryAccess";
import { dailySeries, parsePeriodDays, COMPLETED_SQL } from "../../../utils/libraryStats";

/**
 * GET /api/library/admin/analytics?days=30
 * Сводная аналитика библиотеки за период.
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);
  requireLibraryPermission(user);

  const days = parsePeriodDays(getQuery(event).days);
  const since = "CURDATE() - INTERVAL ? DAY";
  const p = days - 1;

  await closeStaleSessions();

  const [fund] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS books,
            SUM(status = 'ready') AS ready,
            COALESCE(SUM(total_pages), 0) AS pages,
            SUM(created_at >= ${since}) AS added
     FROM books WHERE deleted_at IS NULL`,
    [p],
  );

  const [period] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS sessions,
            COUNT(DISTINCT s.user_id) AS readers,
            COUNT(DISTINCT s.book_id) AS books_read,
            COALESCE(SUM(s.active_seconds), 0) AS seconds,
            COALESCE(SUM(s.pages_viewed), 0) AS pages_viewed
     FROM book_reading_sessions s
     JOIN books b ON b.id = s.book_id AND b.deleted_at IS NULL
     WHERE s.started_at >= ${since}`,
    [p],
  );

  // Тот же показатель за предыдущий период — для трендов
  const [prev] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS sessions,
            COUNT(DISTINCT s.user_id) AS readers,
            COALESCE(SUM(s.active_seconds), 0) AS seconds
     FROM book_reading_sessions s
     WHERE s.started_at >= CURDATE() - INTERVAL ? DAY AND s.started_at < ${since}`,
    [p + days, p],
  );

  const [completions] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS total, SUM(p.completed_at >= ${since}) AS period
     FROM book_reading_progress p JOIN books b ON b.id = p.book_id AND b.deleted_at IS NULL
     WHERE ${COMPLETED_SQL("p", "b")}`,
    [p],
  );

  const [allReaders] = await executeQuery<any[]>(
    `SELECT COUNT(DISTINCT p.user_id) AS readers FROM book_reading_progress p
     JOIN books b ON b.id = p.book_id AND b.deleted_at IS NULL`,
  );

  const [now] = await executeQuery<any[]>(
    `SELECT COUNT(DISTINCT s.user_id) AS readers FROM book_reading_sessions s WHERE ${activeSessionSql("s")}`,
  );

  const topBooks = await executeQuery<any[]>(
    `SELECT b.id, b.title, b.author, b.total_pages,
            COUNT(DISTINCT s.user_id) AS readers,
            COUNT(*) AS sessions,
            COALESCE(SUM(s.active_seconds), 0) AS seconds
     FROM book_reading_sessions s
     JOIN books b ON b.id = s.book_id AND b.deleted_at IS NULL
     WHERE s.started_at >= ${since}
     GROUP BY b.id, b.title, b.author, b.total_pages
     ORDER BY readers DESC, seconds DESC
     LIMIT 8`,
    [p],
  );

  const topReaders = await executeQuery<any[]>(
    `SELECT u.id, u.name, u.email, u.role,
            COUNT(DISTINCT s.book_id) AS books,
            COALESCE(SUM(s.active_seconds), 0) AS seconds,
            MAX(s.last_activity_at) AS last_activity
     FROM book_reading_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.started_at >= ${since}
     GROUP BY u.id, u.name, u.email, u.role
     ORDER BY seconds DESC, books DESC
     LIMIT 8`,
    [p],
  );

  const byRole = await executeQuery<any[]>(
    `SELECT u.role, COUNT(DISTINCT s.user_id) AS readers, COALESCE(SUM(s.active_seconds), 0) AS seconds
     FROM book_reading_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.started_at >= ${since}
     GROUP BY u.role ORDER BY readers DESC`,
    [p],
  );

  const byLanguage = await executeQuery<any[]>(
    `SELECT COALESCE(b.language, '—') AS language, COUNT(*) AS books,
            (SELECT COUNT(DISTINCT x.user_id) FROM book_reading_progress x
             JOIN books y ON y.id = x.book_id AND y.deleted_at IS NULL
             WHERE COALESCE(y.language, '—') = COALESCE(b.language, '—')) AS readers
     FROM books b WHERE b.deleted_at IS NULL
     GROUP BY COALESCE(b.language, '—') ORDER BY books DESC`,
  );

  // Что требует внимания
  const noAccess = await executeQuery<any[]>(
    `SELECT b.id, b.title FROM books b
     WHERE b.deleted_at IS NULL AND b.status = 'ready'
       AND NOT EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = b.id)
     ORDER BY b.created_at DESC LIMIT 50`,
  );
  const unread = await executeQuery<any[]>(
    `SELECT b.id, b.title FROM books b
     WHERE b.deleted_at IS NULL AND b.status = 'ready'
       AND EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = b.id)
       AND NOT EXISTS (SELECT 1 FROM book_reading_sessions s WHERE s.book_id = b.id AND s.started_at >= ${since})
     ORDER BY b.created_at DESC LIMIT 50`,
    [p],
  );
  const expiring = await executeQuery<any[]>(
    `SELECT ba.id, ba.expires_at, b.id AS book_id, b.title,
            COALESCE(u.name, sg.code, c.name, ba.role_name) AS target
     FROM book_access ba
     JOIN books b ON b.id = ba.book_id AND b.deleted_at IS NULL
     LEFT JOIN users u ON u.id = ba.user_id
     LEFT JOIN study_groups sg ON sg.id = ba.group_id
     LEFT JOIN courses c ON c.id = ba.course_id
     WHERE ba.expires_at > NOW() AND ba.expires_at < NOW() + INTERVAL 7 DAY
     ORDER BY ba.expires_at ASC LIMIT 20`,
  );
  const [attentionCounts] = await executeQuery<any[]>(
    `SELECT
       SUM(NOT EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = b.id)) AS without_access,
       SUM(EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = b.id)
           AND NOT EXISTS (SELECT 1 FROM book_reading_sessions s WHERE s.book_id = b.id AND s.started_at >= ${since})) AS unread
     FROM books b WHERE b.deleted_at IS NULL AND b.status = 'ready'`,
    [p],
  );
  const [failed] = await executeQuery<any[]>(
    `SELECT COUNT(*) AS n FROM books WHERE deleted_at IS NULL AND status = 'error'`,
  );

  const daily = await dailySeries(days);
  const n = (v: unknown) => Number(v || 0);
  const trend = (cur: number, before: number) => (before > 0 ? Math.round(((cur - before) / before) * 100) : null);

  return {
    days,
    kpi: {
      books: n(fund?.books),
      readyBooks: n(fund?.ready),
      pages: n(fund?.pages),
      addedBooks: n(fund?.added),
      readers: n(period?.readers),
      readersTrend: trend(n(period?.readers), n(prev?.readers)),
      sessions: n(period?.sessions),
      sessionsTrend: trend(n(period?.sessions), n(prev?.sessions)),
      seconds: n(period?.seconds),
      secondsTrend: trend(n(period?.seconds), n(prev?.seconds)),
      pagesViewed: n(period?.pages_viewed),
      booksRead: n(period?.books_read),
      completions: n(completions?.period),
      completionsTotal: n(completions?.total),
      readersTotal: n(allReaders?.readers),
      readingNow: n(now?.readers),
    },
    daily,
    topBooks: topBooks.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      readers: n(b.readers),
      sessions: n(b.sessions),
      seconds: n(b.seconds),
    })),
    topReaders: topReaders.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: ROLE_LABELS[r.role] || r.role,
      books: n(r.books),
      seconds: n(r.seconds),
      lastActivity: r.last_activity,
    })),
    byRole: byRole.map((r) => ({ role: ROLE_LABELS[r.role] || r.role, readers: n(r.readers), seconds: n(r.seconds) })),
    byLanguage: byLanguage.map((l) => ({ language: l.language, books: n(l.books), readers: n(l.readers) })),
    attention: {
      withoutAccessCount: n(attentionCounts?.without_access),
      unreadInPeriodCount: n(attentionCounts?.unread),
      withoutAccess: noAccess.map((b) => ({ id: b.id, title: b.title })),
      unreadInPeriod: unread.map((b) => ({ id: b.id, title: b.title })),
      expiringAccess: expiring.map((e) => ({
        id: e.id,
        bookId: e.book_id,
        title: e.title,
        target: ROLE_LABELS[e.target] || e.target,
        expiresAt: e.expires_at,
      })),
      failedBooks: n(failed?.n),
    },
  };
});
