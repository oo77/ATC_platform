import type { PoolConnection } from "mysql2/promise";

export const description = "Add personal fields and update diploma fields in instructors table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Updating instructors table with personal fields...");

  // Clear existing values to avoid JSON validation errors if any
  await connection.query(`UPDATE instructors SET diploma_file_id = NULL`);

  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN birth_date DATE NULL COMMENT 'Instructor birth date',
    ADD COLUMN passport_data VARCHAR(255) NULL COMMENT 'Passport series and number',
    DROP COLUMN diploma_file_id,
    ADD COLUMN diploma_file_ids JSON NULL COMMENT 'List of diploma file UUIDs'
  `);

  console.log("✅ Instructors table updated");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Reverting instructors table personal fields...");

  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN birth_date,
    DROP COLUMN passport_data,
    DROP COLUMN diploma_file_ids,
    ADD COLUMN diploma_file_id CHAR(36) NULL COMMENT 'Diploma file UUID'
  `);

  console.log("✅ Instructors table reverted");
};
