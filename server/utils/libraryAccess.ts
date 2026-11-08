/**
 * Единые правила доступа к библиотеке.
 *
 * Раньше каталог, чтение и обложки проверяли доступ по-разному: каталог видел
 * только персональные и ролевые записи, чтение — ещё группы и курсы, обложки —
 * не проверяли ничего. Здесь одна точка правды для всех эндпоинтов.
 */
import { createError, getQuery, readBody, type H3Event } from "h3";
import { roleHasPermission } from "./permissions";
import { Permission } from "../types/permissions";
import { executeQuery } from "./db";

/** Через сколько минут без активности сессия чтения считается закрытой */
export const SESSION_IDLE_MINUTES = 10;

/** Роли, которым можно выдать доступ к книге */
export const LIBRARY_ROLES = ["STUDENT", "TEACHER", "MANAGER", "ADMIN"] as const;
export type LibraryRole = (typeof LIBRARY_ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Слушатели",
  TEACHER: "Преподаватели",
  MANAGER: "Менеджеры",
  ADMIN: "Администраторы",
};

export type AccessTargetType = "user" | "group" | "course" | "role";

interface LibraryUser {
  id: string;
  role: string;
}

/** Персонал библиотеки видит и открывает все книги */
export function isLibraryStaff(user: LibraryUser): boolean {
  return roleHasPermission(user as any, Permission.LIBRARY_MANAGE);
}

export function requireLibraryPermission(user: LibraryUser, permission: Permission = Permission.LIBRARY_MANAGE): void {
  if (!roleHasPermission(user as any, permission)) {
    throw createError({ statusCode: 403, message: "Недостаточно прав для управления библиотекой" });
  }
}

/**
 * Условие для строки book_access `ba`: запись относится к пользователю
 * (лично, по роли, через группу или через курс своей группы) и не истекла.
 * Параметры: accessParams(user).
 */
export function accessMatchSql(ba = "ba"): string {
  return `(${ba}.expires_at IS NULL OR ${ba}.expires_at > NOW())
    AND (
      ${ba}.user_id = ?
      OR ${ba}.role_name = ?
      OR ${ba}.group_id IN (
        SELECT sgs.group_id FROM study_group_students sgs
        JOIN students s ON s.id = sgs.student_id
        WHERE s.user_id = ?
      )
      OR ${ba}.course_id IN (
        SELECT sg.course_id FROM study_groups sg
        JOIN study_group_students sgs ON sgs.group_id = sg.id
        JOIN students s ON s.id = sgs.student_id
        WHERE s.user_id = ?
      )
    )`;
}

export function accessParams(user: LibraryUser): string[] {
  return [user.id, user.role, user.id, user.id];
}

/** EXISTS-предикат «у пользователя есть доступ к книге `${book}.id`» */
export function accessExistsSql(book = "b"): string {
  return `EXISTS (SELECT 1 FROM book_access ba WHERE ba.book_id = ${book}.id AND ${accessMatchSql("ba")})`;
}

/** Есть ли у пользователя право открыть книгу (книга должна существовать и не быть удалённой) */
export async function canReadBook(user: LibraryUser, bookId: string): Promise<boolean> {
  if (isLibraryStaff(user)) {
    const rows = await executeQuery<any[]>(
      "SELECT 1 FROM books WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [bookId],
    );
    return rows.length > 0;
  }
  const rows = await executeQuery<any[]>(
    `SELECT 1 FROM books b WHERE b.id = ? AND b.deleted_at IS NULL AND ${accessExistsSql("b")} LIMIT 1`,
    [bookId, ...accessParams(user)],
  );
  return rows.length > 0;
}

export async function requireBookAccess(user: LibraryUser, bookId: string): Promise<void> {
  if (!(await canReadBook(user, bookId))) {
    throw createError({ statusCode: 403, message: "У вас нет доступа к этой книге" });
  }
}

/** Закрывает «зависшие» сессии (вкладку закрыли без end) по времени последней активности */
export async function closeStaleSessions(bookId?: string): Promise<void> {
  await executeQuery(
    `UPDATE book_reading_sessions
     SET ended_at = last_activity_at
     WHERE ended_at IS NULL
       AND last_activity_at < NOW() - INTERVAL ${SESSION_IDLE_MINUTES} MINUTE
       ${bookId ? "AND book_id = ?" : ""}`,
    bookId ? [bookId] : [],
  );
}

/** SQL-условие «сессия активна прямо сейчас» для алиаса таблицы сессий */
export function activeSessionSql(s = "s"): string {
  return `${s}.ended_at IS NULL AND ${s}.last_activity_at > NOW() - INTERVAL ${SESSION_IDLE_MINUTES} MINUTE`;
}

/**
 * Активная сессия пользователя для книги по токену.
 * Токен выдаётся при старте сессии и привязывает запросы файла/прогресса
 * к конкретной сессии — прямую ссылку на PDF нельзя переслать другому человеку.
 */
export async function getSessionByToken(
  userId: string,
  bookId: string,
  token: string | undefined,
): Promise<{ id: string; current_page: number; idle_seconds: number } | null> {
  if (!token || typeof token !== "string" || token.length > 128) return null;
  const rows = await executeQuery<any[]>(
    `SELECT s.id, s.current_page, TIMESTAMPDIFF(SECOND, s.last_activity_at, NOW()) AS idle_seconds
     FROM book_reading_sessions s
     WHERE s.session_token = ? AND s.user_id = ? AND s.book_id = ? AND ${activeSessionSql("s")}
     LIMIT 1`,
    [token, userId, bookId],
  );
  return rows[0] || null;
}

/** Достаёт токен сессии из заголовка, query или тела запроса */
export async function readSessionToken(event: H3Event, fromBody = false): Promise<string | undefined> {
  const header = event.node.req.headers["x-reading-token"];
  if (typeof header === "string" && header) return header;
  const q = getQuery(event).token;
  if (typeof q === "string" && q) return q;
  if (fromBody) {
    const body = await readBody(event).catch(() => null);
    if (body && typeof body.token === "string") return body.token;
  }
  return undefined;
}

/** Безопасное число в диапазоне */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Сообщение об ошибке без внутренних подробностей БД */
export function libraryError(statusCode: number, message: string): never {
  throw createError({ statusCode, message });
}
