import type { PoolConnection } from "mysql2/promise";

/**
 * Migration: Add language column to questions table
 * Date: 2026-02-06
 * Description: Adds language column to questions table to support multilingual questions
 */

export const description = "Add language column to questions table";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Add language column to questions table");

  // Добавляем колонку language в таблицу questions
  await connection.query(`
    ALTER TABLE questions 
    ADD COLUMN language ENUM('ru', 'uz', 'en') NOT NULL DEFAULT 'ru' 
    AFTER difficulty
  `);

  // Добавляем индекс для оптимизации запросов по языку
  await connection.query(`
    ALTER TABLE questions 
    ADD INDEX idx_language (language)
  `);

  console.log("✅ Language column added to questions table");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back: Remove language column from questions table");

  // Удаляем индекс
  await connection.query(`
    ALTER TABLE questions 
    DROP INDEX idx_language
  `);

  // Удаляем колонку
  await connection.query(`
    ALTER TABLE questions 
    DROP COLUMN language
  `);

  console.log("✅ Language column removed from questions table");
};
