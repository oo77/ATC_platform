import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция: Название курса без ограничения длины
 * Дата: 2026-10-12
 * Описание: courses.name и courses.name_uz были VARCHAR(255), и длинные названия учебных
 * программ обрезались до 255 символов (в нестрогом режиме MySQL/MariaDB — молча).
 * Колонки становятся TEXT. Обычный индекс по TEXT-колонке возможен только с длиной
 * префикса, поэтому idx_name пересоздаётся по первым 191 символам названия.
 */

export const description =
  "Название курса (courses.name, name_uz) без ограничения в 255 символов";

async function hasNameIndex(connection: PoolConnection): Promise<boolean> {
  const [indexes] = await connection.query<any[]>(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'courses'
       AND INDEX_NAME = 'idx_name'`,
  );
  return indexes.length > 0;
}

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: 20261012_046_course_names_without_length_limit");

  // Проверяем, не сняты ли ограничения раньше
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME, DATA_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'courses'
       AND COLUMN_NAME IN ('name', 'name_uz')`,
  );
  if (columns.length === 2 && columns.every((column) => column.DATA_TYPE === "text")) {
    console.log('ℹ️  Columns "name" and "name_uz" in "courses" are already TEXT, skipping...');
    return;
  }

  await connection.query(`
    ALTER TABLE courses
    ${(await hasNameIndex(connection)) ? "DROP INDEX idx_name," : ""}
    MODIFY name TEXT NOT NULL,
    MODIFY name_uz TEXT NULL,
    ADD INDEX idx_name (name(191))
  `);

  console.log("✅ Migration 20261012_046_course_names_without_length_limit completed successfully");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: 20261012_046_course_names_without_length_limit");

  // Названия длиннее 255 символов в прежние колонки не помещаются — обрезаются
  await connection.query(`
    UPDATE courses
    SET name = LEFT(name, 255), name_uz = LEFT(name_uz, 255)
    WHERE CHAR_LENGTH(name) > 255 OR CHAR_LENGTH(name_uz) > 255
  `);

  await connection.query(`
    ALTER TABLE courses
    ${(await hasNameIndex(connection)) ? "DROP INDEX idx_name," : ""}
    MODIFY name VARCHAR(255) NOT NULL,
    MODIFY name_uz VARCHAR(255) NULL,
    ADD INDEX idx_name (name)
  `);

  console.log("✅ Rollback completed successfully");
};
