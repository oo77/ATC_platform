import { PoolConnection } from "mysql2/promise";

/**
 * Migration 007: Library System
 * Date: 2026-01-28
 * Description: Creates tables for:
 * - books (books metadata)
 * - book_pages (converted pages)
 * - book_access (access control)
 * - book_reading_sessions (active sessions)
 * - book_reading_progress (user progress)
 */

export const description = "Library System";

export async function up(connection: PoolConnection): Promise<void> {
  // 1. books
  await connection.query(`
    CREATE TABLE IF NOT EXISTS books (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NULL,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      isbn VARCHAR(20) NULL,
      language VARCHAR(10) NULL,
      
      original_file_path VARCHAR(500) NOT NULL,
      cover_path VARCHAR(500) NULL,
      
      total_pages INT NOT NULL DEFAULT 0,
      file_size_bytes BIGINT DEFAULT 0,
      
      status ENUM('processing', 'ready', 'error') DEFAULT 'processing',
      processing_error TEXT NULL,
      is_published BOOLEAN DEFAULT FALSE,
      
      uploaded_by VARCHAR(191) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_books_status (status),
      INDEX idx_books_published (is_published),
      INDEX idx_books_category (category),
      INDEX idx_books_deleted (deleted_at),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. book_pages
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_pages (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      page_number INT NOT NULL,
      image_path VARCHAR(500) NOT NULL,
      width INT NULL,
      height INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE KEY uk_book_page (book_id, page_number),
      INDEX idx_book_pages_book_id (book_id),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. book_access
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_access (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      
      user_id VARCHAR(191) NULL,
      group_id VARCHAR(191) NULL,
      course_id VARCHAR(191) NULL,
      role_name VARCHAR(50) NULL,
      
      expires_at TIMESTAMP NULL,
      
      granted_by VARCHAR(191) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_book_access_book_id (book_id),
      INDEX idx_book_access_user_id (user_id),
      INDEX idx_book_access_group_id (group_id),
      INDEX idx_book_access_course_id (course_id),
      INDEX idx_book_access_expires (expires_at),
      
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (granted_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. book_reading_sessions
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_reading_sessions (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      
      session_token VARCHAR(64) NOT NULL UNIQUE,
      current_page INT DEFAULT 1,
      
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      
      INDEX idx_reading_sessions_book_user (book_id, user_id),
      INDEX idx_reading_sessions_token (session_token),
      INDEX idx_reading_sessions_activity (last_activity_at),
      
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. book_reading_progress
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_reading_progress (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      
      last_page INT DEFAULT 1,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE KEY uk_book_user_progress (book_id, user_id),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("✅ Library System tables created");
}

export async function down(connection: PoolConnection): Promise<void> {
  await connection.query("DROP TABLE IF EXISTS book_reading_progress");
  await connection.query("DROP TABLE IF EXISTS book_reading_sessions");
  await connection.query("DROP TABLE IF EXISTS book_access");
  await connection.query("DROP TABLE IF EXISTS book_pages");
  await connection.query("DROP TABLE IF EXISTS books");
}
