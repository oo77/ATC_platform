import type { PoolConnection } from "mysql2/promise";

export const description = "Add personal fields (birth_date, photo_base64) to students table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Updating students table with personal fields...");

  await connection.query(`
    ALTER TABLE students
    ADD COLUMN birth_date DATE NULL COMMENT 'Student birth date',
    ADD COLUMN photo_base64 LONGTEXT NULL COMMENT 'Profile photo in base64'
  `);

  console.log("✅ Students table updated");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Reverting students table personal fields...");

  await connection.query(`
    ALTER TABLE students
    DROP COLUMN birth_date,
    DROP COLUMN photo_base64
  `);

  console.log("✅ Students table reverted");
};
