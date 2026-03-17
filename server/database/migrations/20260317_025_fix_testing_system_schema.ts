import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 025: Fix Testing System Schema
 * Date: 2026-03-17
 * Description: Adds missing columns to test_templates and test_sessions tables
 * to match repository expectations and fix "allowed_languages" error.
 */

export const description = "Fix Testing System Schema (test_templates, test_sessions)";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("🔄 Running migration: Fix Testing System Schema");

  // 1. Add allowed_languages to test_templates
  try {
    await connection.query(`
      ALTER TABLE test_templates 
      ADD COLUMN allowed_languages JSON NULL AFTER proctoring_settings
    `);
    console.log("✅ Column allowed_languages added to test_templates");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column allowed_languages already exists in test_templates, skipping");
    } else {
      throw error;
    }
  }

  // 2. Add missing columns to test_sessions
  try {
    // language
    await connection.query(`
      ALTER TABLE test_sessions 
      ADD COLUMN language ENUM('ru', 'uz', 'en') NULL AFTER status
    `);
    console.log("✅ Column language added to test_sessions");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column language already exists in test_sessions, skipping");
    } else {
      throw error;
    }
  }

  try {
    // is_preview
    await connection.query(`
      ALTER TABLE test_sessions 
      ADD COLUMN is_preview BOOLEAN NOT NULL DEFAULT FALSE AFTER language
    `);
    console.log("✅ Column is_preview added to test_sessions");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column is_preview already exists in test_sessions, skipping");
    } else {
      throw error;
    }
  }

  try {
    // preview_user_id
    await connection.query(`
      ALTER TABLE test_sessions 
      ADD COLUMN preview_user_id VARCHAR(191) NULL AFTER is_preview
    `);
    console.log("✅ Column preview_user_id added to test_sessions");
  } catch (error: any) {
    if (error.errno === 1060) {
      console.log("⚠️ Column preview_user_id already exists in test_sessions, skipping");
    } else {
      throw error;
    }
  }

  // 3. Make assignment_id and student_id nullable in test_sessions (required for previews)
  try {
    await connection.query(`
      ALTER TABLE test_sessions 
      MODIFY COLUMN assignment_id VARCHAR(191) NULL,
      MODIFY COLUMN student_id VARCHAR(191) NULL
    `);
    console.log("✅ Columns assignment_id and student_id made nullable in test_sessions");
  } catch (error: any) {
    console.warn("⚠️ Warning: Could not modify columns in test_sessions:", error.message);
    // Continue even if this fails (might fail if data is inconsistent or FKs prevent it)
  }

  // 4. Add FK for preview_user_id
  try {
    await connection.query(`
      ALTER TABLE test_sessions
      ADD CONSTRAINT fk_test_sessions_preview_user 
      FOREIGN KEY (preview_user_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log("✅ FK fk_test_sessions_preview_user added to test_sessions");
  } catch (error: any) {
    if (error.errno === 1061 || error.errno === 121) {
      console.log("⚠️ FK or index already exists, skipping");
    } else {
      console.warn("⚠️ Warning: Could not add FK for preview_user_id:", error.message);
    }
  }

  console.log("✅ Migration 025 Fix Testing System Schema completed");
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("🔄 Rolling back Fix Testing System Schema");

  try {
    await connection.query("ALTER TABLE test_sessions DROP FOREIGN KEY fk_test_sessions_preview_user");
  } catch (e) {}

  try {
    await connection.query("ALTER TABLE test_sessions DROP COLUMN preview_user_id");
  } catch (e) {}

  try {
    await connection.query("ALTER TABLE test_sessions DROP COLUMN is_preview");
  } catch (e) {}

  try {
    await connection.query("ALTER TABLE test_sessions DROP COLUMN language");
  } catch (e) {}

  try {
    await connection.query("ALTER TABLE test_templates DROP COLUMN allowed_languages");
  } catch (e) {}

  // We don't revert nullability to avoid breaking data if someone left it null
  
  console.log("✅ Fix Testing System Schema rolled back");
}
