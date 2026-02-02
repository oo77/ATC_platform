import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 006: Schedule Templates
 * Date: 2026-01-23
 * Description: Creates table for schedule templates.
 */

export const description = "Schedule Templates for mass assignment";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Schedule Templates");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL COMMENT 'Template Name',
      description TEXT,
      source_group_id VARCHAR(191) COMMENT 'Source Group ID (for reference)',
      events_data JSON NOT NULL COMMENT 'Serialized events data',
      created_by VARCHAR(191) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_created_by (created_by),
      CONSTRAINT fk_schedule_templates_source_group FOREIGN KEY (source_group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("✅ Created table: schedule_templates");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Schedule Templates");
  await connection.query(`DROP TABLE IF EXISTS schedule_templates`);
};
