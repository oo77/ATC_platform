import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 026: Add test-related columns to grades table
 * Date: 2026-03-19
 * Description: Adds missing columns (is_from_test, test_session_id, original_grade,
 *              is_modified, modified_by, modified_at) to the grades table so that
 *              test results can be properly saved to the discipline journal.
 *
 * Root cause: The initial_schema (001) did not include these columns.
 *             The legacy migration 20260106_033_grades_from_test was marked as
 *             "already applied" but never actually ran on existing databases.
 *             As a result, the INSERT in finish.post.ts was silently failing
 *             because the referenced columns did not exist.
 */

export const description =
  "Add test-related columns to grades table (is_from_test, test_session_id, original_grade, is_modified, modified_by, modified_at)";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("🔄 Running migration: Add test-related columns to grades");

  // 1. is_from_test
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD COLUMN is_from_test BOOLEAN NOT NULL DEFAULT FALSE AFTER notes
    `);
    console.log("✅ Column is_from_test added to grades");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column is_from_test already exists in grades, skipping");
    } else {
      throw error;
    }
  }

  // 2. test_session_id
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD COLUMN test_session_id VARCHAR(191) NULL AFTER is_from_test
    `);
    console.log("✅ Column test_session_id added to grades");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log(
        "⚠️ Column test_session_id already exists in grades, skipping"
      );
    } else {
      throw error;
    }
  }

  // 3. original_grade
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD COLUMN original_grade INT NULL AFTER test_session_id
    `);
    console.log("✅ Column original_grade added to grades");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log(
        "⚠️ Column original_grade already exists in grades, skipping"
      );
    } else {
      throw error;
    }
  }

  // 4. is_modified
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD COLUMN is_modified BOOLEAN NOT NULL DEFAULT FALSE AFTER original_grade
    `);
    console.log("✅ Column is_modified added to grades");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column is_modified already exists in grades, skipping");
    } else {
      throw error;
    }
  }

  // 5. modified_by
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD COLUMN modified_by VARCHAR(191) NULL AFTER is_modified
    `);
    console.log("✅ Column modified_by added to grades");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column modified_by already exists in grades, skipping");
    } else {
      throw error;
    }
  }

  // 6. modified_at
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD COLUMN modified_at DATETIME(3) NULL AFTER modified_by
    `);
    console.log("✅ Column modified_at added to grades");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column modified_at already exists in grades, skipping");
    } else {
      throw error;
    }
  }

  // 7. FK for test_session_id → test_sessions (optional, only if table exists)
  try {
    // Check if test_sessions table exists
    const [tables] = await connection.query<any[]>(
      "SHOW TABLES LIKE 'test_sessions'"
    );
    if (tables.length > 0) {
      await connection.query(`
        ALTER TABLE grades
        ADD CONSTRAINT fk_grades_test_session
        FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("✅ FK fk_grades_test_session added to grades");
    } else {
      console.log("⚠️ Table test_sessions not found, skipping FK");
    }
  } catch (error: any) {
    if (error.errno === 1061 || error.errno === 121 || error.errno === 1826) {
      console.log("⚠️ FK fk_grades_test_session already exists, skipping");
    } else {
      console.warn(
        "⚠️ Could not add FK for test_session_id:",
        error.message
      );
    }
  }

  // 8. FK for modified_by → users
  try {
    await connection.query(`
      ALTER TABLE grades
      ADD CONSTRAINT fk_grades_modified_by
      FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("✅ FK fk_grades_modified_by added to grades");
  } catch (error: any) {
    if (error.errno === 1061 || error.errno === 121 || error.errno === 1826) {
      console.log("⚠️ FK fk_grades_modified_by already exists, skipping");
    } else {
      console.warn("⚠️ Could not add FK for modified_by:", error.message);
    }
  }

  console.log("✅ Migration 026 Add test-related columns to grades completed");
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("🔄 Rolling back: Add test-related columns to grades");

  const fks = ["fk_grades_modified_by", "fk_grades_test_session"];
  for (const fk of fks) {
    try {
      await connection.query(`ALTER TABLE grades DROP FOREIGN KEY ${fk}`);
    } catch (_) {}
  }

  const cols = [
    "modified_at",
    "modified_by",
    "is_modified",
    "original_grade",
    "test_session_id",
    "is_from_test",
  ];
  for (const col of cols) {
    try {
      await connection.query(`ALTER TABLE grades DROP COLUMN ${col}`);
    } catch (_) {}
  }

  console.log("✅ Migration 026 rolled back");
}
