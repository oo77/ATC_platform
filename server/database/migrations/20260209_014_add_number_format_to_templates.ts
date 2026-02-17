import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Добавление недостающих полей в certificate_templates
 * Дата: 2026-02-09
 * Описание: Добавляет все недостающие колонки для работы с шаблонами сертификатов
 */

export const description = "Add missing columns to certificate_templates";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding missing columns to certificate_templates...");

  // Список колонок для добавления
  const columnsToAdd = [
    {
      name: "original_file_url",
      definition:
        "VARCHAR(500) NULL COMMENT 'URL оригинального файла шаблона (DOCX)' AFTER template_file_url",
    },
    {
      name: "variables",
      definition:
        "JSON NULL COMMENT 'Переменные для подстановки в шаблон' AFTER original_file_url",
    },
    {
      name: "qr_settings",
      definition: "JSON NULL COMMENT 'Настройки QR-кода' AFTER variables",
    },
    {
      name: "number_format",
      definition:
        "VARCHAR(100) NOT NULL DEFAULT 'ATC{YY}_{CODE}_{NUM}' COMMENT 'Формат номера сертификата' AFTER qr_settings",
    },
    {
      name: "last_number",
      definition:
        "INT NOT NULL DEFAULT 0 COMMENT 'Последний использованный номер' AFTER number_format",
    },
    {
      name: "template_data",
      definition:
        "JSON NULL COMMENT 'Данные визуального редактора' AFTER last_number",
    },
    {
      name: "layout",
      definition:
        "ENUM('A4_portrait', 'A4_landscape', 'letter_portrait', 'letter_landscape') NULL COMMENT 'Формат и ориентация' AFTER template_data",
    },
    {
      name: "background_url",
      definition:
        "VARCHAR(500) NULL COMMENT 'URL фонового изображения' AFTER layout",
    },
  ];

  // Добавляем каждую колонку, если её нет
  for (const column of columnsToAdd) {
    const [existing] = await connection.query<any[]>(
      `SHOW COLUMNS FROM certificate_templates LIKE ?`,
      [column.name],
    );

    if (!existing || existing.length === 0) {
      await connection.query(`
        ALTER TABLE certificate_templates
        ADD COLUMN ${column.name} ${column.definition}
      `);
      console.log(`✅ Column '${column.name}' added`);
    } else {
      console.log(`ℹ️  Column '${column.name}' already exists`);
    }
  }

  console.log("✅ Migration completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing added columns from certificate_templates...");

  const columnsToRemove = [
    "background_url",
    "layout",
    "template_data",
    "last_number",
    "number_format",
    "qr_settings",
    "variables",
    "original_file_url",
  ];

  // Удаляем колонки в обратном порядке
  for (const columnName of columnsToRemove) {
    const [existing] = await connection.query<any[]>(
      `SHOW COLUMNS FROM certificate_templates LIKE ?`,
      [columnName],
    );

    if (existing && existing.length > 0) {
      await connection.query(`
        ALTER TABLE certificate_templates
        DROP COLUMN ${columnName}
      `);
      console.log(`✅ Column '${columnName}' removed`);
    }
  }

  console.log("✅ Rollback completed successfully");
};
