import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add user_id to students table
 * Date: 2026-02-03
 * Description: Adds user_id column to students table to support bidirectional
 *              relationship between users and students. This allows both:
 *              - users.student_id → students.id (existing)
 *              - students.user_id → users.id (new)
 */

export const description = "Add user_id column to students table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding user_id column to students table...");

  // Check if column already exists
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'students' 
     AND COLUMN_NAME = 'user_id'`,
  );

  if (columns.length > 0) {
    console.log("⚠️  Column user_id already exists, skipping...");
    return;
  }

  // Add user_id column
  await connection.query(`
    ALTER TABLE students
    ADD COLUMN user_id VARCHAR(191) NULL COMMENT 'Link to user account' AFTER position,
    ADD INDEX idx_user_id (user_id),
    ADD CONSTRAINT fk_students_user 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
  `);

  console.log("✅ Column user_id added to students table");

  // Sync existing data: if users.student_id exists, set students.user_id
  console.log("🔄 Syncing existing user-student relationships...");

  await connection.query(`
    UPDATE students s
    INNER JOIN users u ON u.student_id = s.id
    SET s.user_id = u.id
    WHERE s.user_id IS NULL
  `);

  console.log("✅ Existing relationships synced");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing user_id column from students table...");

  // Check if column exists
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'students' 
     AND COLUMN_NAME = 'user_id'`,
  );

  if (columns.length === 0) {
    console.log("⚠️  Column user_id does not exist, skipping...");
    return;
  }

  // Drop foreign key first
  await connection.query(`
    ALTER TABLE students
    DROP FOREIGN KEY fk_students_user,
    DROP INDEX idx_user_id,
    DROP COLUMN user_id
  `);

  console.log("✅ Column user_id removed from students table");
};
