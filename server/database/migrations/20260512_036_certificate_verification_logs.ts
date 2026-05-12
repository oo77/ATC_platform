import type { PoolConnection } from "mysql2/promise";

export const description =
  "Create certificate_verification_logs table for public audit logging";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Creating certificate_verification_logs table...");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificate_verification_logs (
      id            CHAR(36)     NOT NULL DEFAULT (UUID()),
      cert_number   VARCHAR(100) NOT NULL COMMENT 'Certificate number checked',
      ip_address    VARCHAR(45)  NULL     COMMENT 'Visitor IP (IPv4 or IPv6)',
      user_agent    TEXT         NULL     COMMENT 'Browser User-Agent',
      result        ENUM('found','not_found') NOT NULL COMMENT 'Verification result',
      created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

      PRIMARY KEY (id),
      INDEX idx_cert_number (cert_number),
      INDEX idx_ip_address  (ip_address),
      INDEX idx_created_at  (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Logs of public certificate verification requests'
  `);

  console.log("✅ certificate_verification_logs table created");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Dropping certificate_verification_logs table...");

  await connection.query(`DROP TABLE IF EXISTS certificate_verification_logs`);

  console.log("✅ certificate_verification_logs table dropped");
};
