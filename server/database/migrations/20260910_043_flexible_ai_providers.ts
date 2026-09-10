/**
 * Migration: Flexible AI Providers
 * Date: 2026-09-10
 * Description: Modifies provider column in ai_settings from ENUM to VARCHAR(50)
 *              to support top 10 providers and custom OpenAI-compatible endpoints.
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "Гибкие AI провайдеры (top 10 + custom) - изменение колонки provider на VARCHAR(50)";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: Flexible AI Providers");

  // Изменяем ENUM('openai', 'openrouter', 'anthropic', 'custom') на VARCHAR(50)
  try {
    await connection.query(`
      ALTER TABLE ai_settings 
      MODIFY COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'openrouter'
    `);
    console.log("✅ Modified ai_settings.provider to VARCHAR(50)");
  } catch (error: any) {
    console.warn("⚠️ Warning modifying ai_settings.provider (might already be VARCHAR):", error?.message);
  }
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Reverting migration: Flexible AI Providers");

  try {
    await connection.query(`
      ALTER TABLE ai_settings 
      MODIFY COLUMN provider ENUM('openai', 'openrouter', 'anthropic', 'custom') NOT NULL DEFAULT 'openrouter'
    `);
    console.log("✅ Reverted ai_settings.provider to ENUM");
  } catch (error: any) {
    console.warn("⚠️ Warning reverting ai_settings.provider:", error?.message);
  }
};
