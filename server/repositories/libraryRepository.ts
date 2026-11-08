/**
 * Repository для работы с системой библиотеки
 *
 * Управляет:
 * - books: основная информация о книгах
 * - book_pages: конвертированные страницы
 * - book_access: права доступа к книгам
 * - book_reading_sessions: активные сессии чтения
 * - book_reading_progress: прогресс чтения пользователей
 */

import { getDbPool } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { canReadBook } from "../utils/libraryAccess";
import { resolveBookFilePath } from "../utils/pdfProcessor";

const db = getDbPool();

// ========================================
// ТИПЫ
// ========================================

export type BookStatus = "processing" | "ready" | "error";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: string | null;
  isbn: string | null;
  language: string | null;
  published_year: number | null;
  original_file_path: string;
  cover_path: string | null;
  total_pages: number;
  file_size_bytes: number;
  status: BookStatus;
  processing_error: string | null;
  is_published: boolean;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BookPage {
  id: string;
  book_id: string;
  page_number: number;
  image_path: string;
  width: number | null;
  height: number | null;
  created_at: Date;
}

export interface BookAccess {
  id: string;
  book_id: string;
  user_id: string | null;
  group_id: string | null;
  course_id: string | null;
  role_name: string | null;
  expires_at: Date | null;
  granted_by: string;
  created_at: Date;
}

export interface BookReadingSession {
  id: string;
  book_id: string;
  user_id: string;
  session_token: string;
  current_page: number;
  ip_address: string | null;
  user_agent: string | null;
  started_at: Date;
  last_activity_at: Date;
  ended_at: Date | null;
}

export interface BookReadingProgress {
  id: string;
  book_id: string;
  user_id: string;
  last_page: number;
  last_read_at: Date;
}

export interface CreateBookData {
  title: string;
  author?: string;
  description?: string;
  category?: string;
  isbn?: string;
  language?: string;
  published_year?: number;
  original_file_path: string;
  cover_path?: string;
  total_pages: number;
  file_size_bytes: number;
  uploaded_by: string;
}

export interface UpdateBookData {
  title?: string;
  author?: string | null;
  description?: string | null;
  category?: string | null;
  isbn?: string | null;
  language?: string;
  published_year?: number | null;
  cover_path?: string;
  status?: BookStatus;
  processing_error?: string;
  is_published?: boolean;
}

export interface CreateBookAccessData {
  book_id: string;
  user_id?: string;
  group_id?: string;
  course_id?: string;
  role_name?: string;
  expires_at?: Date;
  granted_by: string;
}

// ========================================
// BOOKS - Основные операции
// ========================================

/**
 * Создать новую книгу
 */
export async function createBook(data: CreateBookData): Promise<string> {
  const id = uuidv4();

  await db.execute(
    `INSERT INTO books (
      id, title, author, description, category, isbn, language, published_year,
      original_file_path, cover_path, total_pages, file_size_bytes,
      status, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?)`,
    [
      id,
      data.title,
      data.author || null,
      data.description || null,
      data.category || null,
      data.isbn || null,
      data.language || "ru",
      data.published_year || null,
      data.original_file_path,
      data.cover_path || null,
      data.total_pages,
      data.file_size_bytes,
      data.uploaded_by,
    ],
  );

  return id;
}

/**
 * Получить книгу по ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  const [rows] = await db.execute<(Book & RowDataPacket)[]>(
    "SELECT * FROM books WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  const book = rows[0];
  if (!book) return null;
  // Путь из БД может указывать на другую машину — подставляем реальное расположение файла
  book.original_file_path = resolveBookFilePath(book.original_file_path);
  return book;
}

/**
 * Получить все книги (с фильтрацией)
 */
export async function getBooks(filters?: {
  status?: BookStatus;
  is_published?: boolean;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Book[]> {
  let query = "SELECT * FROM books WHERE deleted_at IS NULL";
  const params: any[] = [];

  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  if (filters?.is_published !== undefined) {
    query += " AND is_published = ?";
    params.push(filters.is_published);
  }

  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }

  if (filters?.search) {
    query += " AND (title LIKE ? OR author LIKE ?)";
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern);
  }

  query += " ORDER BY created_at DESC";

  if (filters?.limit) {
    query += " LIMIT ?";
    params.push(filters.limit);

    if (filters?.offset) {
      query += " OFFSET ?";
      params.push(filters.offset);
    }
  }

  const [rows] = await db.execute<(Book & RowDataPacket)[]>(query, params);
  return rows;
}

/**
 * Обновить книгу
 */
export async function updateBook(
  id: string,
  data: UpdateBookData,
): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    params.push(data.title);
  }

  if (data.author !== undefined) {
    fields.push("author = ?");
    params.push(data.author);
  }

  if (data.description !== undefined) {
    fields.push("description = ?");
    params.push(data.description);
  }

  if (data.category !== undefined) {
    fields.push("category = ?");
    params.push(data.category);
  }

  if (data.isbn !== undefined) {
    fields.push("isbn = ?");
    params.push(data.isbn);
  }

  if (data.cover_path !== undefined) {
    fields.push("cover_path = ?");
    params.push(data.cover_path);
  }

  if (data.status !== undefined) {
    fields.push("status = ?");
    params.push(data.status);
  }

  if (data.processing_error !== undefined) {
    fields.push("processing_error = ?");
    params.push(data.processing_error);
  }

  if (data.is_published !== undefined) {
    fields.push("is_published = ?");
    params.push(data.is_published);
  }

  if (data.language !== undefined) {
    fields.push("language = ?");
    params.push(data.language);
  }

  if (data.published_year !== undefined) {
    fields.push("published_year = ?");
    params.push(data.published_year);
  }

  if (fields.length === 0) return;

  params.push(id);

  await db.execute(
    `UPDATE books SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );
}

/**
 * Удалить книгу (soft delete)
 */
export async function deleteBook(id: string): Promise<void> {
  await db.execute("UPDATE books SET deleted_at = NOW() WHERE id = ?", [id]);
}

/**
 * Опубликовать книгу
 */
export async function publishBook(id: string): Promise<void> {
  await db.execute("UPDATE books SET is_published = TRUE WHERE id = ?", [id]);
}

/**
 * Снять книгу с публикации
 */
export async function unpublishBook(id: string): Promise<void> {
  await db.execute("UPDATE books SET is_published = FALSE WHERE id = ?", [id]);
}

// ========================================
// BOOK_PAGES - Управление страницами
// ========================================

/**
 * Создать страницу книги
 */
export async function createBookPage(data: {
  book_id: string;
  page_number: number;
  image_path: string;
  width?: number;
  height?: number;
}): Promise<string> {
  const id = uuidv4();

  await db.execute(
    `INSERT INTO book_pages (id, book_id, page_number, image_path, width, height)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.book_id,
      data.page_number,
      data.image_path,
      data.width || null,
      data.height || null,
    ],
  );

  return id;
}

/**
 * Получить страницу книги
 */
export async function getBookPage(
  bookId: string,
  pageNumber: number,
): Promise<BookPage | null> {
  const [rows] = await db.execute<(BookPage & RowDataPacket)[]>(
    "SELECT * FROM book_pages WHERE book_id = ? AND page_number = ?",
    [bookId, pageNumber],
  );

  return rows[0] || null;
}

/**
 * Получить все страницы книги
 */
export async function getBookPages(bookId: string): Promise<BookPage[]> {
  const [rows] = await db.execute<(BookPage & RowDataPacket)[]>(
    "SELECT * FROM book_pages WHERE book_id = ? ORDER BY page_number",
    [bookId],
  );

  return rows;
}

// ========================================
// BOOK_ACCESS - Управление доступом
// ========================================

/**
 * Создать доступ к книге
 */
export async function createBookAccess(
  data: CreateBookAccessData,
): Promise<string> {
  const id = uuidv4();

  await db.execute(
    `INSERT INTO book_access (
      id, book_id, user_id, group_id, course_id, role_name, expires_at, granted_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.book_id,
      data.user_id || null,
      data.group_id || null,
      data.course_id || null,
      data.role_name || null,
      data.expires_at || null,
      data.granted_by,
    ],
  );

  return id;
}

/**
 * Получить все доступы к книге
 */
export async function getBookAccesses(bookId: string): Promise<BookAccess[]> {
  const [rows] = await db.execute<(BookAccess & RowDataPacket)[]>(
    "SELECT * FROM book_access WHERE book_id = ? ORDER BY created_at DESC",
    [bookId],
  );

  return rows;
}

/**
 * Удалить доступ
 */
export async function deleteBookAccess(accessId: string): Promise<void> {
  await db.execute("DELETE FROM book_access WHERE id = ?", [accessId]);
}

/**
 * Проверить доступ пользователя к книге.
 * Использует те же правила, что каталог и обложки (server/utils/libraryAccess.ts):
 * персонал библиотеки — все книги; остальные — личный доступ, роль, группа или курс.
 */
export async function checkUserBookAccess(
  userId: string,
  bookId: string,
): Promise<boolean> {
  const [userRows] = await db.execute<RowDataPacket[]>(
    `SELECT id, role FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
  const user = userRows[0];
  if (!user) return false;
  return canReadBook({ id: String(user.id), role: String(user.role) }, bookId);
}

// ========================================
// BOOK_READING_SESSIONS - Управление сессиями
// ========================================

/**
 * Создать сессию чтения
 */
export async function createReadingSession(data: {
  book_id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
}): Promise<{ id: string; session_token: string }> {
  const id = uuidv4();
  // 64 hex-символа — ровно под VARCHAR(64); uuid+uuid давал 72 символа
  const session_token = randomBytes(32).toString("hex");

  await db.execute(
    `INSERT INTO book_reading_sessions (
      id, book_id, user_id, session_token, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.book_id,
      data.user_id,
      session_token,
      data.ip_address || null,
      data.user_agent || null,
    ],
  );

  return { id, session_token };
}

/**
 * Обновить активность сессии (heartbeat).
 * Порядок SET важен: MySQL применяет присваивания слева направо, поэтому
 * pages_viewed и active_seconds считаются от старых current_page/last_activity_at.
 */
export async function updateSessionActivity(
  sessionId: string,
  currentPage?: number,
  addSeconds = 0,
): Promise<void> {
  const seconds = Math.max(0, Math.round(addSeconds));
  if (currentPage !== undefined) {
    await db.execute(
      `UPDATE book_reading_sessions
       SET pages_viewed = pages_viewed + IF(current_page <> ?, 1, 0),
           active_seconds = active_seconds + ?,
           current_page = ?,
           last_activity_at = NOW()
       WHERE id = ?`,
      [currentPage, seconds, currentPage, sessionId],
    );
  } else {
    await db.execute(
      "UPDATE book_reading_sessions SET active_seconds = active_seconds + ?, last_activity_at = NOW() WHERE id = ?",
      [seconds, sessionId],
    );
  }
}

/**
 * Завершить сессию
 */
export async function endReadingSession(sessionId: string): Promise<void> {
  await db.execute(
    "UPDATE book_reading_sessions SET ended_at = NOW() WHERE id = ?",
    [sessionId],
  );
}

/**
 * Завершить все старые сессии пользователя для книги
 */
export async function endUserBookSessions(
  userId: string,
  bookId: string,
): Promise<void> {
  await db.execute(
    `UPDATE book_reading_sessions 
     SET ended_at = NOW() 
     WHERE user_id = ? AND book_id = ? AND ended_at IS NULL`,
    [userId, bookId],
  );
}

// ========================================
// BOOK_READING_PROGRESS - Управление прогрессом
// ========================================

/**
 * Сохранить прогресс чтения.
 * last_page — где остановился читатель, max_page — дальше всего, куда он дошёл
 * (по нему считаем завершение), total_seconds — накопленное реальное время чтения.
 */
export async function saveReadingProgress(
  userId: string,
  bookId: string,
  lastPage: number,
  options: { totalPages?: number; addSeconds?: number } = {},
): Promise<void> {
  const addSeconds = Math.max(0, Math.round(options.addSeconds || 0));
  const totalPages = options.totalPages || 0;
  await db.execute(
    `INSERT INTO book_reading_progress
       (id, book_id, user_id, last_page, max_page, total_seconds, first_read_at, last_read_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), IF(? > 0 AND ? >= ?, NOW(), NULL))
     ON DUPLICATE KEY UPDATE
       completed_at = IF(completed_at IS NULL AND ? > 0 AND GREATEST(max_page, ?) >= ?, NOW(), completed_at),
       last_page = ?,
       max_page = GREATEST(max_page, ?),
       total_seconds = total_seconds + ?,
       first_read_at = COALESCE(first_read_at, NOW()),
       last_read_at = NOW()`,
    [
      uuidv4(), bookId, userId, lastPage, lastPage, addSeconds,
      totalPages, lastPage, totalPages,
      totalPages, lastPage, totalPages,
      lastPage, lastPage, addSeconds,
    ],
  );
}

/**
 * Получить прогресс чтения
 */
export async function getReadingProgress(
  userId: string,
  bookId: string,
): Promise<BookReadingProgress | null> {
  const [rows] = await db.execute<(BookReadingProgress & RowDataPacket)[]>(
    "SELECT * FROM book_reading_progress WHERE user_id = ? AND book_id = ?",
    [userId, bookId],
  );

  return rows[0] || null;
}
