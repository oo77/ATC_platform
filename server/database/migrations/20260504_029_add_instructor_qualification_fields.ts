import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add qualification fields to instructors table
 * Date: 2026-05-04
 * Description: Adds fields for education, university, specialty, academic degree, 
 *              rank, certificates, languages, photo and additional files.
 */

export const description = "Add qualification fields to instructors table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding qualification fields to instructors table...");

  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN education TEXT NULL COMMENT 'Education info',
    ADD COLUMN university VARCHAR(255) NULL COMMENT 'Graduated University',
    ADD COLUMN diploma_file_id CHAR(36) NULL COMMENT 'Diploma file UUID',
    ADD COLUMN specialty VARCHAR(255) NULL COMMENT 'Specialty by education',
    ADD COLUMN academic_degree VARCHAR(255) NULL COMMENT 'Academic degree',
    ADD COLUMN academic_rank VARCHAR(255) NULL COMMENT 'Academic rank',
    ADD COLUMN certificates JSON NULL COMMENT 'List of certificates [{name, date, file_id}]',
    ADD COLUMN languages JSON NULL COMMENT 'List of languages',
    ADD COLUMN photo_base64 LONGTEXT NULL COMMENT 'Profile photo in base64',
    ADD COLUMN additional_files JSON NULL COMMENT 'List of additional file UUIDs'
  `);

  console.log("✅ Qualification fields added to instructors table");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing qualification fields from instructors table...");

  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN education,
    DROP COLUMN university,
    DROP COLUMN diploma_file_id,
    DROP COLUMN specialty,
    DROP COLUMN academic_degree,
    DROP COLUMN academic_rank,
    DROP COLUMN certificates,
    DROP COLUMN languages,
    DROP COLUMN photo_base64,
    DROP COLUMN additional_files
  `);

  console.log("✅ Qualification fields removed from instructors table");
};
