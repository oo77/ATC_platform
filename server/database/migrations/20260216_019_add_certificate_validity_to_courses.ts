import type { PoolConnection } from "mysql2/promise";

export const description =
  "Add certificate_validity_months column to courses table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Running Migration: Add certificate_validity_months to courses...",
  );

  await connection.query(`
    ALTER TABLE courses
    ADD COLUMN certificate_validity_months INT NULL COMMENT 'Validity period in months, null for permanent'
    AFTER certificate_template_id
  `);

  console.log(
    '✅ Added column "certificate_validity_months" to "courses" table',
  );
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Rolling back Migration: Remove certificate_validity_months from courses...",
  );

  await connection.query(`
    ALTER TABLE courses
    DROP COLUMN certificate_validity_months
  `);

  console.log(
    '✅ Removed column "certificate_validity_months" from "courses" table',
  );
};
