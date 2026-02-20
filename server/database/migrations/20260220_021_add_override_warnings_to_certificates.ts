import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add override_warnings to issued_certificates
 * Date: 2026-02-20
 * Description: Adds the missing override_warnings column to issued_certificates table.
 *              This column is required by the certificate issuance logic to allow
 *              administrators to override eligibility warnings for specific students.
 */

export const description =
  "Add override_warnings column to issued_certificates table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log(
    "🔄 Running migration: Add override_warnings to issued_certificates",
  );

  const columnExists = async (columnName: string) => {
    const [columns] = await connection.query<any[]>(
      `SHOW COLUMNS FROM issued_certificates LIKE '${columnName}'`,
    );
    return columns && columns.length > 0;
  };

  if (!(await columnExists("override_warnings"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN override_warnings BOOLEAN NOT NULL DEFAULT FALSE",
    );
    console.log("✅ Added override_warnings column");
  } else {
    console.log("ℹ️  Column override_warnings already exists, skipping");
  }

  console.log("✅ Migration completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back: Add override_warnings to issued_certificates");

  try {
    await connection.query(
      "ALTER TABLE issued_certificates DROP COLUMN override_warnings",
    );
    console.log("✅ Dropped override_warnings column");
  } catch (e: any) {
    console.warn("⚠️  Could not drop override_warnings:", e.message);
  }

  console.log("✅ Rollback completed");
};
