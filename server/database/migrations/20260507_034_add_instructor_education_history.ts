import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add education_history to instructors table
 * Date: 2026-05-07
 * Description: Adds education_history JSON column to store multiple education entries.
 *              Migrates existing data from flat columns to the first entry of the array.
 */

export const description = "Add education_history JSON column to instructors table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Adding education_history column to instructors table...");

  // 1. Добавляем колонку
  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN education_history JSON NULL COMMENT 'List of education entries [{education, university, specialty, diploma_file_ids}]'
  `);

  // 2. Мигрируем существующие данные
  // Получаем всех инструкторов с заполненными данными об образовании
  const [instructors]: any = await connection.query(`
    SELECT id, education, university, specialty, diploma_file_ids 
    FROM instructors 
    WHERE education IS NOT NULL OR university IS NOT NULL OR specialty IS NOT NULL OR diploma_file_ids IS NOT NULL
  `);

  console.log(`📦 Migrating education data for ${instructors.length} instructors...`);

  for (const instructor of instructors) {
    const educationEntry = {
      education: instructor.education || "",
      university: instructor.university || "",
      specialty: instructor.specialty || "",
      diploma_file_ids: instructor.diploma_file_ids || []
    };

    const history = [educationEntry];

    await connection.query(
      "UPDATE instructors SET education_history = ? WHERE id = ?",
      [JSON.stringify(history), instructor.id]
    );
  }

  console.log("✅ Education history added and data migrated");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Removing education_history column from instructors table...");

  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN education_history
  `);

  console.log("✅ Education history column removed");
};
