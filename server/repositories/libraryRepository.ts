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
import type { RowDataPacket, ResultSetHeader } from "mysql2";

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
  original_file_path: string;
  cover_path: string | null;
  total_pages: number;
  file_size_bytes: number;
  status: BookStatus;
  processing_error: string | null;
  is_published: boolean;
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
  original_file_path: string;
  cover_path?: string;
  total_pages: number;
  file_size_bytes: number;
  file_size_bytes: number;
  uploaded_by: string;
}

export interface UpdateBookData {
  title?: string;
  author?: string;
  description?: string;
  category?: string;
  isbn?: string;
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
      id, title, author, description, category, isbn,
      original_file_path, cover_path, total_pages, file_size_bytes,
      status, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?)`,
    [
      id,
      data.title,
      data.author || null,
      data.description || null,
      data.category || null,
      data.isbn || null,
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

  return rows[0] || null;
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
 * Проверить доступ пользователя к книге
 */
export async function checkUserBookAccess(
  userId: string,
  bookId: string,
): Promise<boolean> {
  // Проверяем роль пользователя - админы и модераторы имеют доступ ко всем книгам
  const [userRole] = await db.execute<RowDataPacket[]>(
    `SELECT role FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );

  if (userRole.length > 0) {
    const role = userRole[0].role;
    if (role === "ADMIN" || role === "MANAGER") {
      return true;
    }
  }

  // Проверяем прямой доступ пользователя
  const [directAccess] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM book_access 
     WHERE book_id = ? 
       AND user_id = ? 
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [bookId, userId],
  );

  if (directAccess.length > 0) return true;

  // Проверяем доступ через группы
  const [groupAccess] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM book_access ba
     INNER JOIN study_group_students sgs ON ba.group_id = sgs.group_id
     WHERE ba.book_id = ? 
       AND sgs.student_id IN (SELECT id FROM students WHERE user_id = ?)
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
     LIMIT 1`,
    [bookId, userId],
  );

  if (groupAccess.length > 0) return true;

  // Проверяем доступ через курсы
  const [courseAccess] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM book_access ba
     INNER JOIN study_groups sg ON ba.course_id = sg.course_id
     INNER JOIN study_group_students sgs ON sg.id = sgs.group_id
     WHERE ba.book_id = ? 
       AND sgs.student_id IN (SELECT id FROM students WHERE user_id = ?)
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
     LIMIT 1`,
    [bookId, userId],
  );

  if (courseAccess.length > 0) return true;

  // Проверяем доступ по роли
  const [roleAccess] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM book_access ba
     INNER JOIN users u ON ba.role_name = u.role
     WHERE ba.book_id = ? 
       AND u.id = ?
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
     LIMIT 1`,
    [bookId, userId],
  );

  return roleAccess.length > 0;
}

/**
 * Получить доступные книги для пользователя
 */
export async function getUserAccessibleBooks(userId: string): Promise<Book[]> {
  const [rows] = await db.execute<(Book & RowDataPacket)[]>(
    `SELECT DISTINCT b.* FROM books b
     INNER JOIN book_access ba ON b.id = ba.book_id
     LEFT JOIN group_students gs ON ba.group_id = gs.group_id
     LEFT JOIN students s ON gs.student_id = s.id
     LEFT JOIN study_groups sg ON ba.course_id = sg.course_id
     LEFT JOIN group_students gs2 ON sg.id = gs2.group_id
     LEFT JOIN students s2 ON gs2.student_id = s2.id
     LEFT JOIN users u ON ba.role_name = u.role
     WHERE b.is_published = TRUE 
       AND b.status = 'ready'
       AND b.deleted_at IS NULL
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
       AND (
         ba.user_id = ? OR
         s.user_id = ? OR
         s2.user_id = ? OR
         u.id = ?
       )
     ORDER BY b.created_at DESC`,
    [userId, userId, userId, userId],
  );

  return rows;
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
  const session_token = uuidv4() + uuidv4(); // 64 символа

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
 * Получить активную сессию по токену
 */
export async function getSessionByToken(
  token: string,
): Promise<BookReadingSession | null> {
  const [rows] = await db.execute<(BookReadingSession & RowDataPacket)[]>(
    `SELECT * FROM book_reading_sessions 
     WHERE session_token = ? 
       AND ended_at IS NULL
       AND last_activity_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
    [token],
  );

  return rows[0] || null;
}

/**
 * Обновить активность сессии
 */
export async function updateSessionActivity(
  sessionId: string,
  currentPage?: number,
): Promise<void> {
  if (currentPage !== undefined) {
    await db.execute(
      "UPDATE book_reading_sessions SET last_activity_at = NOW(), current_page = ? WHERE id = ?",
      [currentPage, sessionId],
    );
  } else {
    await db.execute(
      "UPDATE book_reading_sessions SET last_activity_at = NOW() WHERE id = ?",
      [sessionId],
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
 * Сохранить прогресс чтения
 */
export async function saveReadingProgress(
  userId: string,
  bookId: string,
  lastPage: number,
): Promise<void> {
  await db.execute(
    `INSERT INTO book_reading_progress (id, book_id, user_id, last_page, last_read_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_page = ?, last_read_at = NOW()`,
    [uuidv4(), bookId, userId, lastPage, lastPage],
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
