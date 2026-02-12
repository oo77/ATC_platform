import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add user_id column to instructors table
 * Date: 2026-02-12
 * Description: Adds user_id column to link instructors with user accounts for authentication
 */

export const description = "Add user_id column to instructors table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding user_id column to instructors table...");

  // Check if column already exists
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'instructors' 
       AND COLUMN_NAME = 'user_id'`,
  );

  if (columns.length > 0) {
    console.log("⚠️  Column user_id already exists in instructors table");
    return;
  }

  // Add user_id column
  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN user_id VARCHAR(191) NULL COMMENT 'Link to user account for authentication'
    AFTER is_active
  `);

  console.log("✅ Column user_id added to instructors table");

  // Add index for user_id
  await connection.query(`
    ALTER TABLE instructors
    ADD INDEX idx_user_id (user_id)
  `);

  console.log("✅ Index idx_user_id added");

  // Add foreign key constraint
  await connection.query(`
    ALTER TABLE instructors
    ADD CONSTRAINT fk_instructors_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
  `);

  console.log("✅ Foreign key constraint fk_instructors_user added");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing user_id column from instructors table...");

  // Drop foreign key constraint
  await connection.query(`
    ALTER TABLE instructors
    DROP FOREIGN KEY fk_instructors_user
  `);

  console.log("✅ Foreign key constraint fk_instructors_user dropped");

  // Drop index
  await connection.query(`
    ALTER TABLE instructors
    DROP INDEX idx_user_id
  `);

  console.log("✅ Index idx_user_id dropped");

  // Drop column
  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN user_id
  `);

  console.log("✅ Column user_id removed from instructors table");
};
