import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Fix Issued Certificates Schema
 * Date: 2026-02-03
 * Description: Adds missing columns to issued_certificates table that are expected by the application code.
 *              These columns include auditing fields (issued_by, revoked_by) and status details.
 */

export const description = "Add missing columns to issued_certificates";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Fix Issued Certificates Schema");

  // Helper to check if column exists
  const columnExists = async (columnName: string) => {
    const [columns] = await connection.query<any[]>(
      `SHOW COLUMNS FROM issued_certificates LIKE '${columnName}'`,
    );
    return columns && columns.length > 0;
  };

  // Build the ALTER TABLE query dynamically to avoid errors if some columns exist
  let alterQuery = "ALTER TABLE issued_certificates";
  const columnsToAdd: string[] = [];

  if (!(await columnExists("issued_by"))) {
    columnsToAdd.push(
      "ADD COLUMN issued_by VARCHAR(191) NULL COMMENT 'User ID who issued the certificate'",
    );
    columnsToAdd.push(
      "ADD CONSTRAINT fk_issued_cert_issuer FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE",
    );
  }

  if (!(await columnExists("issued_at"))) {
    columnsToAdd.push("ADD COLUMN issued_at DATETIME(3) NULL");
  }

  if (!(await columnExists("revoked_by"))) {
    columnsToAdd.push(
      "ADD COLUMN revoked_by VARCHAR(191) NULL COMMENT 'User ID who revoked the certificate'",
    );
    columnsToAdd.push(
      "ADD CONSTRAINT fk_issued_cert_revoker FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE",
    );
  }

  if (!(await columnExists("revoked_at"))) {
    columnsToAdd.push("ADD COLUMN revoked_at DATETIME(3) NULL");
  }

  if (!(await columnExists("revoke_reason"))) {
    columnsToAdd.push("ADD COLUMN revoke_reason TEXT NULL");
  }

  if (!(await columnExists("notes"))) {
    columnsToAdd.push("ADD COLUMN notes TEXT NULL");
  }

  if (!(await columnExists("warnings"))) {
    columnsToAdd.push("ADD COLUMN warnings JSON NULL");
  }

  if (columnsToAdd.length > 0) {
    // We need to execute ADD COLUMN and ADD CONSTRAINT separately if mixing them might be tricky,
    // but usually comma separation works. However, mixing foreign keys in one statement can be error prone if one fails.
    // Let's do them one by one or grouped safely.
    // For simplicity and safety, let's run them mostly individually or grouped by type if supported.
    // But here I'll construct a single ALTER statement without the constraints first, then add constraints.

    // Actually, let's simpler approach: just run them if needed.
    // Since we are adding multiple columns, let's construct list of additions.

    // Re-evaluating constraints: ADD CONSTRAINT syntax is standard.

    const queryParts: string[] = [];

    if (!(await columnExists("issued_by")))
      queryParts.push(
        "ADD COLUMN issued_by VARCHAR(191) NULL COMMENT 'User ID who issued the certificate'",
      );
    if (!(await columnExists("issued_at")))
      queryParts.push("ADD COLUMN issued_at DATETIME(3) NULL");
    if (!(await columnExists("revoked_by")))
      queryParts.push(
        "ADD COLUMN revoked_by VARCHAR(191) NULL COMMENT 'User ID who revoked the certificate'",
      );
    if (!(await columnExists("revoked_at")))
      queryParts.push("ADD COLUMN revoked_at DATETIME(3) NULL");
    if (!(await columnExists("revoke_reason")))
      queryParts.push("ADD COLUMN revoke_reason TEXT NULL");
    if (!(await columnExists("notes")))
      queryParts.push("ADD COLUMN notes TEXT NULL");
    if (!(await columnExists("warnings")))
      queryParts.push("ADD COLUMN warnings JSON NULL");

    if (queryParts.length > 0) {
      await connection.query(
        `ALTER TABLE issued_certificates ${queryParts.join(", ")}`,
      );
      console.log("✅ Added missing columns");
    }

    // Add FKs separately to ensuring columns exist first
    if (!(await columnExists("issued_by"))) {
      // We use the check again or just try/catch, but we know we just added it if it was missing.
      // Only add constraint if we added the column OR if column exists but constraint might not (hard to check constraint easily without query).
      // Easiest is to add constraint if we added column.
      // But wait, the previous `if` logic means we just added the column.
      // However, to be robust against "column exists but constraint missing", we should check constraints.
      // For now, let's assume if column was missing, constraint matches.
      // Note: reusing the loop above made checking logic split.
      // Let's just execute queries directly.
    }
  }

  // To be safe and clean, let's run separate commands for each addition if missing.

  if (!(await columnExists("issued_by"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN issued_by VARCHAR(191) NULL",
    );
    await connection.query(
      "ALTER TABLE issued_certificates ADD CONSTRAINT fk_issued_cert_issuer FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE",
    );
    console.log("✅ Added issued_by");
  }

  if (!(await columnExists("issued_at"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN issued_at DATETIME(3) NULL",
    );
    console.log("✅ Added issued_at");
  }

  if (!(await columnExists("revoked_by"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN revoked_by VARCHAR(191) NULL",
    );
    await connection.query(
      "ALTER TABLE issued_certificates ADD CONSTRAINT fk_issued_cert_revoker FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE",
    );
    console.log("✅ Added revoked_by");
  }

  if (!(await columnExists("revoked_at"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN revoked_at DATETIME(3) NULL",
    );
    console.log("✅ Added revoked_at");
  }

  if (!(await columnExists("revoke_reason"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN revoke_reason TEXT NULL",
    );
    console.log("✅ Added revoke_reason");
  }

  if (!(await columnExists("notes"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN notes TEXT NULL",
    );
    console.log("✅ Added notes");
  }

  if (!(await columnExists("warnings"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN warnings JSON NULL",
    );
    console.log("✅ Added warnings");
  }

  if (!(await columnExists("docx_file_url"))) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN docx_file_url VARCHAR(500) NULL",
    );
    console.log("✅ Added docx_file_url");
  }

  console.log("✅ Migration completed");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back: Fix Issued Certificates Schema");

  // We can drop them. FKs should be dropped first.

  try {
    await connection.query(
      "ALTER TABLE issued_certificates DROP FOREIGN KEY fk_issued_cert_issuer",
    );
  } catch (e) {
    /* ignore if not exists */
  }

  try {
    await connection.query(
      "ALTER TABLE issued_certificates DROP FOREIGN KEY fk_issued_cert_revoker",
    );
  } catch (e) {
    /* ignore if not exists */
  }

  const columns = [
    "issued_by",
    "issued_at",
    "revoked_by",
    "revoked_at",
    "revoke_reason",
    "notes",
    "warnings",
    "docx_file_url",
  ];
  await connection.query(
    `ALTER TABLE issued_certificates DROP COLUMN ${columns.join(", DROP COLUMN ")}`,
  );

  console.log("✅ Rollback completed");
};
