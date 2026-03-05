import type { PoolConnection } from "mysql2/promise";

/**
 * Migration 023: Report Builder System
 * Date: 2026-03-05
 * Description: Creates tables for the configurable report builder.
 *   - report_templates: stores named report configurations (sources, grouping, filters)
 *   - report_template_columns: stores individual column definitions per template
 * NOTE: This migration does NOT modify any existing tables.
 */

export const description = "Report Builder System";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("🔄 Running migration: Report Builder System");

  // 1. report_templates
  await connection.query(`
    CREATE TABLE IF NOT EXISTS report_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL COMMENT 'Название отчёта',
      description TEXT COMMENT 'Описание отчёта',

      data_sources JSON NOT NULL COMMENT 'Задействованные источники данных ["groups","students",...]',
      row_grouping JSON NOT NULL DEFAULT '[]' COMMENT 'Группировка строк [{"field":"org.name"},{"field":"time.month","date_field":"group.start_date"}]',
      filters JSON NOT NULL DEFAULT '{}' COMMENT 'Фильтры {"date_from":"...","date_to":"...","course_ids":[...]}',

      sort_field VARCHAR(100) NULL COMMENT 'Поле сортировки',
      sort_direction ENUM('asc', 'desc') NOT NULL DEFAULT 'asc',

      created_by VARCHAR(191) NOT NULL COMMENT 'Пользователь-создатель',
      is_public BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Доступен всем пользователям',
      last_used_at DATETIME(3) NULL COMMENT 'Последнее использование',
      use_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Количество запусков',

      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

      INDEX idx_rt_created_by (created_by),
      INDEX idx_rt_is_public (is_public),
      INDEX idx_rt_last_used (last_used_at),

      CONSTRAINT fk_rt_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Table report_templates created");

  // 2. report_template_columns
  await connection.query(`
    CREATE TABLE IF NOT EXISTS report_template_columns (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      template_id VARCHAR(191) NOT NULL COMMENT 'Ссылка на шаблон отчёта',

      field_key VARCHAR(150) NOT NULL COMMENT 'Ключ поля: student.full_name, group.students_count и т.д.',
      label VARCHAR(255) NOT NULL COMMENT 'Заголовок столбца (пользовательский)',
      aggregation ENUM(
        'none', 'count', 'count_distinct', 'sum', 'avg', 'min', 'max', 'list'
      ) NOT NULL DEFAULT 'none' COMMENT 'Функция агрегации',

      order_index INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Порядок отображения',
      width SMALLINT UNSIGNED NOT NULL DEFAULT 150 COMMENT 'Ширина столбца в px',
      align ENUM('left', 'center', 'right') NOT NULL DEFAULT 'left',
      format VARCHAR(50) NULL COMMENT 'Формат значения: date:DD.MM.YYYY, number:0.00, percent, boolean:Да/Нет',

      show_in_total BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Показывать в итоговой строке',
      total_aggregation ENUM('sum', 'avg', 'count', 'min', 'max') NOT NULL DEFAULT 'sum',

      INDEX idx_rtc_template_id (template_id),
      INDEX idx_rtc_order (template_id, order_index),

      CONSTRAINT fk_rtc_template
        FOREIGN KEY (template_id) REFERENCES report_templates(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Table report_template_columns created");

  console.log("✅ Migration 023 Report Builder System completed");
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("🔄 Rolling back Report Builder System");
  await connection.query("DROP TABLE IF EXISTS report_template_columns");
  await connection.query("DROP TABLE IF EXISTS report_templates");
  console.log("✅ Report Builder System tables dropped");
}
