import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add work_experience to instructors table
 * Date: 2026-05-07
 * Description: Adds work_experience JSON column to store multiple work history entries.
 */

export const description = "Add work_experience JSON column to instructors table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding work_experience column to instructors table...");

  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN work_experience JSON NULL COMMENT 'List of work experience entries [{employer, position, period}]'
  `);

  console.log("✅ Work experience column added");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing work_experience column from instructors table...");

  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN work_experience
  `);

  console.log("✅ Work experience column removed");
};
