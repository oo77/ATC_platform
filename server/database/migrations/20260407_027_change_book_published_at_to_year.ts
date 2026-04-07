import { PoolConnection } from "mysql2/promise";

/**
 * Migration 027: Change book published_at to published_year
 * Date: 2026-04-07
 * Description: Replaces the 'published_at' DATE column with 'published_year' INT column
 */

export const description = "Replace published_at DATE with published_year INT";

export async function up(connection: PoolConnection): Promise<void> {
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'books' 
     AND COLUMN_NAME = 'published_year'`,
  );

  if (columns.length === 0) {
    // Add new column
    await connection.query(`
      ALTER TABLE books 
      ADD COLUMN published_year INT NULL COMMENT 'Год издания' AFTER language
    `);
    
    // Copy data from old column to new if the old one exists
    const [oldColumns] = await connection.query<any[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'books' 
       AND COLUMN_NAME = 'published_at'`,
    );

    if (oldColumns.length > 0) {
      // Migrate existing years if possible
      await connection.query(`
        UPDATE books SET published_year = YEAR(published_at) WHERE published_at IS NOT NULL
      `);
      
      // Drop old column
      await connection.query(`ALTER TABLE books DROP COLUMN published_at`);
      console.log("✅ Data migrated and column published_at dropped");
    }

    console.log("✅ Column published_year added to books table");
  } else {
    console.log("ℹ️  Column published_year already exists in books table");
  }
}

export async function down(connection: PoolConnection): Promise<void> {
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'books' 
     AND COLUMN_NAME = 'published_year'`,
  );

  if (columns.length > 0) {
    const [oldColumns] = await connection.query<any[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'books' 
       AND COLUMN_NAME = 'published_at'`,
    );
    
    // Fallback: create published_at if not exists
    if (oldColumns.length === 0) {
      await connection.query(`
        ALTER TABLE books 
        ADD COLUMN published_at DATE NULL COMMENT 'Дата выпуска книги' AFTER language
      `);
      
      // Basic reverse migration: year to January 1st of that year
      await connection.query(`
        UPDATE books 
        SET published_at = STR_TO_DATE(CONCAT(published_year, '-01-01'), '%Y-%m-%d') 
        WHERE published_year IS NOT NULL
      `);
    }

    await connection.query(`ALTER TABLE books DROP COLUMN published_year`);
    console.log("✅ Column published_year removed from books table");
  }
}
