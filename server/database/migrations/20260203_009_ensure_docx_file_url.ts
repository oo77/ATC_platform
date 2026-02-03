import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add docx_file_url column
 * Date: 2026-02-03
 * Description: Ensures docx_file_url column exists in issued_certificates.
 *              This is necessary because the previous migration might have been executed
 *              before the column definition was added to it.
 */

export const description = "Add docx_file_url column";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Add docx_file_url column");

  const [columns] = await connection.query<any[]>(
    "SHOW COLUMNS FROM issued_certificates LIKE 'docx_file_url'",
  );

  if (!columns || columns.length === 0) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN docx_file_url VARCHAR(500) NULL COMMENT 'URL to the generated DOCX file'",
    );
    console.log("✅ Added docx_file_url column");
  } else {
    console.log("⚠️ docx_file_url column already exists");
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back: Add docx_file_url column");

  try {
    const [columns] = await connection.query<any[]>(
      "SHOW COLUMNS FROM issued_certificates LIKE 'docx_file_url'",
    );

    if (columns && columns.length > 0) {
      await connection.query(
        "ALTER TABLE issued_certificates DROP COLUMN docx_file_url",
      );
      console.log("✅ Dropped docx_file_url column");
    }
  } catch (error: any) {
    console.error("⚠️ Failed to drop docx_file_url: " + error.message);
  }
};
