/**
 * Migration: AI Settings System
 * Date: 2026-02-03
 * Description: Creates tables for AI provider settings, token usage history, and API error logs.
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "AI Settings System - настройки провайдеров, лимиты токенов, логи ошибок";

export const up = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Running migration: AI Settings System");

  // 1. Создаем таблицу настроек AI
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id VARCHAR(36) PRIMARY KEY,
      
      -- Основные настройки провайдера
      provider ENUM('openai', 'openrouter', 'anthropic', 'custom') NOT NULL DEFAULT 'openrouter',
      api_key_encrypted VARCHAR(500) NOT NULL,
      api_key_last_four VARCHAR(4) NULL,
      api_key_name VARCHAR(100) NULL,
      base_url VARCHAR(500) NULL,
      
      -- Настройки моделей
      vision_model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-4o',
      text_model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-3.5-turbo',
      
      -- Параметры запросов
      max_tokens INT NOT NULL DEFAULT 1500,
      temperature DECIMAL(3,2) NOT NULL DEFAULT 0.10,
      
      -- Лимиты и бюджет
      monthly_budget_usd DECIMAL(10,2) NULL,
      daily_budget_usd DECIMAL(10,2) NULL,
      max_tokens_per_request INT NOT NULL DEFAULT 4000,
      max_requests_per_day INT NULL,
      
      -- Статус и метаданные
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      last_used_at DATETIME NULL,
      last_error_at DATETIME NULL,
      last_error_message TEXT NULL,
      
      -- Использование токенов (накопительные счетчики)
      total_tokens_used BIGINT NOT NULL DEFAULT 0,
      total_prompt_tokens BIGINT NOT NULL DEFAULT 0,
      total_completion_tokens BIGINT NOT NULL DEFAULT 0,
      total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
      tokens_used_today BIGINT NOT NULL DEFAULT 0,
      tokens_used_this_month BIGINT NOT NULL DEFAULT 0,
      last_usage_reset_date DATE NULL,
      
      -- Аудит
      created_by VARCHAR(36) NULL,
      updated_by VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Индексы
      INDEX idx_provider (provider),
      INDEX idx_is_active (is_active),
      INDEX idx_is_default (is_default),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Created table ai_settings");

  // 2. Создаем таблицу истории использования токенов
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_token_usage_history (
      id VARCHAR(36) PRIMARY KEY,
      setting_id VARCHAR(36) NOT NULL,
      
      -- Детали использования
      model VARCHAR(100) NOT NULL,
      operation_type ENUM('vision', 'text', 'embedding', 'other') NOT NULL DEFAULT 'vision',
      prompt_tokens INT NOT NULL DEFAULT 0,
      completion_tokens INT NOT NULL DEFAULT 0,
      total_tokens INT NOT NULL DEFAULT 0,
      cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
      
      -- Контекст использования
      certificate_log_id VARCHAR(36) NULL,
      user_id VARCHAR(36) NULL,
      
      -- Статус
      status ENUM('success', 'failed', 'partial') NOT NULL DEFAULT 'success',
      error_code VARCHAR(50) NULL,
      error_message TEXT NULL,
      
      -- Время
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- Индексы
      INDEX idx_setting_id (setting_id),
      INDEX idx_created_at (created_at),
      INDEX idx_status (status),
      INDEX idx_operation_type (operation_type),
      
      -- Внешний ключ
      FOREIGN KEY (setting_id) REFERENCES ai_settings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Created table ai_token_usage_history");

  // 3. Создаем таблицу для ошибок AI API (для мониторинга)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_api_errors (
      id VARCHAR(36) PRIMARY KEY,
      setting_id VARCHAR(36) NULL,
      
      -- Детали ошибки
      error_code VARCHAR(50) NOT NULL,
      error_type ENUM('rate_limit', 'insufficient_credits', 'invalid_key', 'model_error', 'network', 'other') NOT NULL,
      error_message TEXT NOT NULL,
      
      -- Контекст
      model VARCHAR(100) NULL,
      tokens_requested INT NULL,
      tokens_available INT NULL,
      
      -- Метаданные
      request_payload JSON NULL,
      response_raw TEXT NULL,
      user_id VARCHAR(36) NULL,
      
      -- Время
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME NULL,
      
      -- Индексы
      INDEX idx_setting_id (setting_id),
      INDEX idx_error_type (error_type),
      INDEX idx_error_code (error_code),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ Created table ai_api_errors");

  console.log("✅ Migration completed: AI Settings System");
};

export const down = async (connection: PoolConnection): Promise<void> => {
  console.log("🔄 Rolling back migration: AI Settings System");

  await connection.query(`DROP TABLE IF EXISTS ai_api_errors`);
  console.log("✅ Dropped table ai_api_errors");

  await connection.query(`DROP TABLE IF EXISTS ai_token_usage_history`);
  console.log("✅ Dropped table ai_token_usage_history");

  await connection.query(`DROP TABLE IF EXISTS ai_settings`);
  console.log("✅ Dropped table ai_settings");

  console.log("✅ Rollback completed: AI Settings System");
};
