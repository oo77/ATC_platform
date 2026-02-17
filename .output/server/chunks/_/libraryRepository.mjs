import { w as getDbPool } from './nitro.mjs';
import { v4 } from 'uuid';

const db = getDbPool();
async function createBook(data) {
  const id = v4();
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
      null,
      data.total_pages,
      data.file_size_bytes,
      data.uploaded_by
    ]
  );
  return id;
}
async function getBookById(id) {
  const [rows] = await db.execute(
    "SELECT * FROM books WHERE id = ? AND deleted_at IS NULL",
    [id]
  );
  return rows[0] || null;
}
async function updateBook(id, data) {
  const fields = [];
  const params = [];
  if (data.title !== void 0) {
    fields.push("title = ?");
    params.push(data.title);
  }
  if (data.author !== void 0) {
    fields.push("author = ?");
    params.push(data.author);
  }
  if (data.description !== void 0) {
    fields.push("description = ?");
    params.push(data.description);
  }
  if (data.category !== void 0) {
    fields.push("category = ?");
    params.push(data.category);
  }
  if (data.isbn !== void 0) {
    fields.push("isbn = ?");
    params.push(data.isbn);
  }
  if (data.cover_path !== void 0) {
    fields.push("cover_path = ?");
    params.push(data.cover_path);
  }
  if (data.status !== void 0) {
    fields.push("status = ?");
    params.push(data.status);
  }
  if (data.processing_error !== void 0) {
    fields.push("processing_error = ?");
    params.push(data.processing_error);
  }
  if (data.is_published !== void 0) {
    fields.push("is_published = ?");
    params.push(data.is_published);
  }
  if (fields.length === 0) return;
  params.push(id);
  await db.execute(
    `UPDATE books SET ${fields.join(", ")} WHERE id = ?`,
    params
  );
}
async function deleteBook(id) {
  await db.execute("UPDATE books SET deleted_at = NOW() WHERE id = ?", [id]);
}
async function getBookPages(bookId) {
  const [rows] = await db.execute(
    "SELECT * FROM book_pages WHERE book_id = ? ORDER BY page_number",
    [bookId]
  );
  return rows;
}
async function createBookAccess(data) {
  const id = v4();
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
      data.granted_by
    ]
  );
  return id;
}
async function checkUserBookAccess(userId, bookId) {
  const [userRole] = await db.execute(
    `SELECT role FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  if (userRole.length > 0) {
    const role = userRole[0].role;
    if (role === "ADMIN" || role === "MANAGER") {
      return true;
    }
  }
  const [directAccess] = await db.execute(
    `SELECT 1 FROM book_access 
     WHERE book_id = ? 
       AND user_id = ? 
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [bookId, userId]
  );
  if (directAccess.length > 0) return true;
  const [groupAccess] = await db.execute(
    `SELECT 1 FROM book_access ba
     INNER JOIN study_group_students sgs ON ba.group_id = sgs.group_id
     WHERE ba.book_id = ? 
       AND sgs.student_id IN (SELECT id FROM students WHERE user_id = ?)
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
     LIMIT 1`,
    [bookId, userId]
  );
  if (groupAccess.length > 0) return true;
  const [courseAccess] = await db.execute(
    `SELECT 1 FROM book_access ba
     INNER JOIN study_groups sg ON ba.course_id = sg.course_id
     INNER JOIN study_group_students sgs ON sg.id = sgs.group_id
     WHERE ba.book_id = ? 
       AND sgs.student_id IN (SELECT id FROM students WHERE user_id = ?)
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
     LIMIT 1`,
    [bookId, userId]
  );
  if (courseAccess.length > 0) return true;
  const [roleAccess] = await db.execute(
    `SELECT 1 FROM book_access ba
     INNER JOIN users u ON ba.role_name = u.role
     WHERE ba.book_id = ? 
       AND u.id = ?
       AND (ba.expires_at IS NULL OR ba.expires_at > NOW())
     LIMIT 1`,
    [bookId, userId]
  );
  return roleAccess.length > 0;
}
async function createReadingSession(data) {
  const id = v4();
  const session_token = v4() + v4();
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
      data.user_agent || null
    ]
  );
  return { id, session_token };
}
async function updateSessionActivity(sessionId, currentPage) {
  if (currentPage !== void 0) {
    await db.execute(
      "UPDATE book_reading_sessions SET last_activity_at = NOW(), current_page = ? WHERE id = ?",
      [currentPage, sessionId]
    );
  } else {
    await db.execute(
      "UPDATE book_reading_sessions SET last_activity_at = NOW() WHERE id = ?",
      [sessionId]
    );
  }
}
async function endReadingSession(sessionId) {
  await db.execute(
    "UPDATE book_reading_sessions SET ended_at = NOW() WHERE id = ?",
    [sessionId]
  );
}
async function saveReadingProgress(userId, bookId, lastPage) {
  await db.execute(
    `INSERT INTO book_reading_progress (id, book_id, user_id, last_page, last_read_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_page = ?, last_read_at = NOW()`,
    [v4(), bookId, userId, lastPage, lastPage]
  );
}
async function getReadingProgress(userId, bookId) {
  const [rows] = await db.execute(
    "SELECT * FROM book_reading_progress WHERE user_id = ? AND book_id = ?",
    [userId, bookId]
  );
  return rows[0] || null;
}

export { createBookAccess as a, getBookPages as b, checkUserBookAccess as c, deleteBook as d, createBook as e, endReadingSession as f, getBookById as g, updateSessionActivity as h, getReadingProgress as i, createReadingSession as j, saveReadingProgress as s, updateBook as u };
//# sourceMappingURL=libraryRepository.mjs.map
