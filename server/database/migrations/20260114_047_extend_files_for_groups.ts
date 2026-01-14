import type { PoolConnection } from "mysql2/promise";

/**
 * Миграция 047: Расширение таблицы files для отчетов групп
 *
 * Добавляет:
 * - original_filename: оригинальное имя файла
 * - uploaded_by_user: ID пользователя, загрузившего файл
 * - uploaded_at_time: дата и время загрузки
 * - category 'group_report' в ENUM
 *
 * Создает индекс для быстрого поиска файлов группы по категории
 */

export const description = "Расширение таблицы files для отчетов групп";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Extending files table for group reports...");

  // Проверяем, существуют ли уже колонки
  const [columns] = await connection.query<any[]>(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'files' 
      AND COLUMN_NAME IN ('original_filename', 'uploaded_by_user', 'uploaded_at_time')
  `);

  const existingColumns = columns.map((col: any) => col.COLUMN_NAME);

  // Добавляем колонки, если их нет
  if (!existingColumns.includes("original_filename")) {
    await connection.query(`
      ALTER TABLE files
      ADD COLUMN original_filename VARCHAR(255) NULL COMMENT 'Оригинальное имя файла при загрузке'
    `);
    console.log("✅ Added original_filename column");
  }

  if (!existingColumns.includes("uploaded_by_user")) {
    await connection.query(`
      ALTER TABLE files
      ADD COLUMN uploaded_by_user VARCHAR(191) NULL COMMENT 'ID пользователя, загрузившего файл'
    `);
    console.log("✅ Added uploaded_by_user column");
  }

  if (!existingColumns.includes("uploaded_at_time")) {
    await connection.query(`
      ALTER TABLE files
      ADD COLUMN uploaded_at_time DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Дата и время загрузки файла'
    `);
    console.log("✅ Added uploaded_at_time column");
  }

  // Добавляем внешний ключ для uploaded_by_user
  const [constraints] = await connection.query<any[]>(`
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'files' 
      AND CONSTRAINT_NAME = 'fk_files_uploaded_by_user'
  `);

  if (constraints.length === 0) {
    await connection.query(`
      ALTER TABLE files
      ADD CONSTRAINT fk_files_uploaded_by_user
        FOREIGN KEY (uploaded_by_user) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("✅ Added foreign key for uploaded_by_user");
  }

  // Проверяем, есть ли 'group_report' в ENUM category
  const [categoryEnum] = await connection.query<any[]>(`
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'files' 
      AND COLUMN_NAME = 'category'
  `);

  if (categoryEnum.length > 0) {
    const enumValues = categoryEnum[0].COLUMN_TYPE;

    if (!enumValues.includes("group_report")) {
      // Добавляем 'group_report' в ENUM
      await connection.query(`
        ALTER TABLE files
        MODIFY COLUMN category ENUM(
          'profile',
          'certificate_template',
          'certificate_generated',
          'course_material',
          'course_media',
          'course_cover',
          'group_gallery',
          'group_file',
          'group_report',
          'assignment',
          'other'
        ) NOT NULL COMMENT 'Категория файла'
      `);
      console.log("✅ Added group_report to category ENUM");
    }
  }

  // Создаем составной индекс для быстрого поиска файлов группы
  const [indexes] = await connection.query<any[]>(`
    SELECT INDEX_NAME 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'files' 
      AND INDEX_NAME = 'idx_files_group_category'
  `);

  if (indexes.length === 0) {
    await connection.query(`
      CREATE INDEX idx_files_group_category ON files(group_id, category)
    `);
    console.log("✅ Created composite index on group_id and category");
  }

  console.log("✅ Files table extended for group reports");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Reverting files table extensions...");

  // Удаляем индекс
  await connection.query(`
    DROP INDEX IF EXISTS idx_files_group_category ON files
  `);

  // Удаляем внешний ключ
  await connection.query(`
    ALTER TABLE files
    DROP FOREIGN KEY IF EXISTS fk_files_uploaded_by_user
  `);

  // Удаляем колонки
  await connection.query(`
    ALTER TABLE files
    DROP COLUMN IF EXISTS original_filename,
    DROP COLUMN IF EXISTS uploaded_by_user,
    DROP COLUMN IF EXISTS uploaded_at_time
  `);

  // Возвращаем ENUM к исходному состоянию
  await connection.query(`
    ALTER TABLE files
    MODIFY COLUMN category ENUM(
      'profile',
      'certificate_template',
      'certificate_generated',
      'course_material',
      'course_media',
      'course_cover',
      'group_gallery',
      'group_file',
      'assignment',
      'other'
    ) NOT NULL COMMENT 'Категория файла'
  `);

  console.log("✅ Files table extensions reverted");
};
