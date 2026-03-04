import { PoolConnection } from "mysql2/promise";

/**
 * Migration 022: Add published_at to books
 * Date: 2026-03-04
 * Description: Adds published_at column to books table for storing book publication date
 */

export const description = "Add published_at column to books table";

export async function up(connection: PoolConnection): Promise<void> {
  // Проверяем, существует ли уже колонка
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'books' 
     AND COLUMN_NAME = 'published_at'`,
  );

  if (columns.length === 0) {
    await connection.query(`
      ALTER TABLE books 
      ADD COLUMN published_at DATE NULL COMMENT 'Дата выпуска книги' AFTER language
    `);
    console.log("✅ Column published_at added to books table");
  } else {
    console.log("ℹ️  Column published_at already exists in books table");
  }
}

export async function down(connection: PoolConnection): Promise<void> {
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'books' 
     AND COLUMN_NAME = 'published_at'`,
  );

  if (columns.length > 0) {
    await connection.query(`ALTER TABLE books DROP COLUMN published_at`);
    console.log("✅ Column published_at removed from books table");
  }
}
