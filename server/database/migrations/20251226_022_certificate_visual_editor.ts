import type { PoolConnection } from 'mysql2/promise';

/**
 * Миграция: Добавление полей для визуального редактора сертификатов
 * Дата: 2025-12-26
 * Описание: 
 * - Добавляет поле template_data для хранения JSON-структуры визуального редактора
 * - Добавляет поле layout для макета (A4_portrait, A4_landscape и т.д.)
 * - Добавляет поле background_url для фонового изображения
 */

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Running migration: certificate_visual_editor');

  // Добавляем новые поля для визуального редактора
  await connection.query(`
    ALTER TABLE certificate_templates 
    ADD COLUMN IF NOT EXISTS template_data JSON COMMENT 'JSON-структура визуального редактора (элементы, позиции, стили)',
    ADD COLUMN IF NOT EXISTS layout VARCHAR(20) DEFAULT 'A4_landscape' COMMENT 'Макет: A4_portrait, A4_landscape, letter_portrait, letter_landscape',
    ADD COLUMN IF NOT EXISTS background_url VARCHAR(500) COMMENT 'URL фонового изображения для шаблона'
  `);

  // Добавляем индекс по layout для быстрого поиска
  await connection.query(`
    CREATE INDEX IF NOT EXISTS idx_layout ON certificate_templates(layout)
  `).catch(() => {
    // Игнорируем ошибку если индекс уже существует
    console.log('ℹ️  Index idx_layout already exists or cannot be created');
  });

  console.log('✅ Migration completed successfully');
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log('🔄 Rolling back migration: certificate_visual_editor');

  // Удаляем индекс
  await connection.query(`
    DROP INDEX IF EXISTS idx_layout ON certificate_templates
  `).catch(() => {
    console.log('ℹ️  Index idx_layout does not exist');
  });

  // Удаляем добавленные поля
  await connection.query(`
    ALTER TABLE certificate_templates 
    DROP COLUMN IF EXISTS template_data,
    DROP COLUMN IF EXISTS layout,
    DROP COLUMN IF EXISTS background_url
  `);

  console.log('✅ Rollback completed successfully');
};

export const description = 'Добавление полей для визуального редактора сертификатов (template_data, layout, background_url)';
