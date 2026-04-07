import type { PoolConnection } from "mysql2/promise";

export const description = "Add course_type (КПП/КПК) to courses table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running Migration: Add course_type to courses...");

  // Проверяем, существует ли уже колонка
  const [columns] = await connection.query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'courses'
       AND COLUMN_NAME = 'course_type'`
  );

  if (columns.length > 0) {
    console.log('ℹ️  Column "course_type" already exists in "courses" table, skipping...');
    return;
  }

  await connection.query(`
    ALTER TABLE courses
    ADD COLUMN course_type ENUM('КПП', 'КПК') NOT NULL DEFAULT 'КПП'
    COMMENT 'Тип курса: КПП (курс повышения профессионального совершенства) или КПК (курсы повышения квалификации)'
    AFTER description
  `);

  console.log('✅ Added column "course_type" to "courses" table');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back Migration: Remove course_type from courses...");

  await connection.query(`
    ALTER TABLE courses
    DROP COLUMN course_type
  `);

  console.log('✅ Removed column "course_type" from "courses" table');
};
