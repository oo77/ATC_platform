import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Шаблоны расписания для массовых операций
 * Дата: 2026-01-23
 * Описание: Создает таблицу для хранения шаблонов расписания,
 * которые можно применять к разным группам/инструкторам
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: schedule_templates");

  // Создаем таблицу шаблонов расписания
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL COMMENT 'Название шаблона',
      description TEXT COMMENT 'Описание шаблона',
      source_group_id VARCHAR(191) COMMENT 'Исходная группа (для информации)',
      events_data JSON NOT NULL COMMENT 'Данные занятий шаблона',
      created_by VARCHAR(191) NOT NULL COMMENT 'Кто создал шаблон',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_source_group_id (source_group_id),
      INDEX idx_created_by (created_by),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at),
      
      CONSTRAINT fk_schedule_templates_source_group 
        FOREIGN KEY (source_group_id) REFERENCES study_groups(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    COMMENT='Шаблоны расписания для массового копирования'
  `);

  console.log("✅ Created table: schedule_templates");
  console.log("✅ Migration completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: schedule_templates");

  await connection.query(`DROP TABLE IF EXISTS schedule_templates`);

  console.log("✅ Rollback completed successfully");
};

export const description =
  "Создание таблицы шаблонов расписания для массовых операций";
