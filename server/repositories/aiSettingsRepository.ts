/**
 * Репозиторий настроек AI
 *
 * Управление настройками AI провайдеров, мониторинг использования токенов,
 * логирование ошибок API
 */

import { getDbPool } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket } from "mysql2";
import crypto from "crypto";

// ============================================================================
// ТИПЫ
// ============================================================================

export type AIProvider = "openai" | "openrouter" | "anthropic" | "custom";
export type AIErrorType =
  | "rate_limit"
  | "insufficient_credits"
  | "invalid_key"
  | "model_error"
  | "network"
  | "other";
export type OperationType = "vision" | "text" | "embedding" | "other";

export interface AISettings {
  id: string;
  provider: AIProvider;
  apiKeyEncrypted: string;
  apiKeyLastFour: string | null;
  apiKeyName: string | null;
  baseUrl: string | null;

  visionModel: string;
  textModel: string;

  maxTokens: number;
  temperature: number;

  monthlyBudgetUsd: number | null;
  dailyBudgetUsd: number | null;
  maxTokensPerRequest: number;
  maxRequestsPerDay: number | null;

  isActive: boolean;
  isDefault: boolean;

  lastUsedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;

  totalTokensUsed: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUsd: number;
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  lastUsageResetDate: Date | null;

  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAISettingsInput {
  provider: AIProvider;
  apiKey: string; // Plain text - will be encrypted
  apiKeyName?: string;
  baseUrl?: string;
  visionModel?: string;
  textModel?: string;
  maxTokens?: number;
  temperature?: number;
  monthlyBudgetUsd?: number;
  dailyBudgetUsd?: number;
  maxTokensPerRequest?: number;
  maxRequestsPerDay?: number;
  isActive?: boolean;
  isDefault?: boolean;
  createdBy?: string;
}

export interface UpdateAISettingsInput {
  provider?: AIProvider;
  apiKey?: string; // Plain text - will be encrypted
  apiKeyName?: string;
  baseUrl?: string;
  visionModel?: string;
  textModel?: string;
  maxTokens?: number;
  temperature?: number;
  monthlyBudgetUsd?: number | null;
  dailyBudgetUsd?: number | null;
  maxTokensPerRequest?: number;
  maxRequestsPerDay?: number | null;
  isActive?: boolean;
  isDefault?: boolean;
  updatedBy?: string;
}

export interface TokenUsageLog {
  id: string;
  settingId: string;
  model: string;
  operationType: OperationType;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  certificateLogId: string | null;
  userId: string | null;
  status: "success" | "failed" | "partial";
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface AIApiError {
  id: string;
  settingId: string | null;
  errorCode: string;
  errorType: AIErrorType;
  errorMessage: string;
  model: string | null;
  tokensRequested: number | null;
  tokensAvailable: number | null;
  requestPayload: any;
  responseRaw: string | null;
  userId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface AISettingsStats {
  totalSettings: number;
  activeSettings: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  errorCount24h: number;
  errorsByType: Record<string, number>;
  usageByModel: Array<{
    model: string;
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  }>;
  recentErrors: AIApiError[];
}

// ============================================================================
// ENCRYPTION HELPERS
// ============================================================================

// Ключ шифрования из переменных окружения или дефолтный (НЕ ДЛЯ ПРОДАКШЕНА!)
const getEncryptionKey = (): Buffer => {
  const key =
    process.env.AI_SETTINGS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "default-encryption-key-32chars!";
  // Ключ должен быть 32 байта для AES-256
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
};

const IV_LENGTH = 16;

const encryptApiKey = (plainText: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decryptApiKey = (encryptedText: string): string => {
  try {
    const [ivHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      getEncryptionKey(),
      iv,
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // Если не удалось расшифровать, возможно ключ сохранён в plain text (legacy)
    return encryptedText;
  }
};

const getLastFour = (apiKey: string): string => {
  if (apiKey.length < 4) return "****";
  return apiKey.slice(-4);
};

// ============================================================================
// REPOSITORY
// ============================================================================

export const aiSettingsRepository = {
  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Создать новые настройки AI
   */
  async create(input: CreateAISettingsInput): Promise<AISettings> {
    const db = getDbPool();
    const id = uuidv4();

    // Если это настройка по умолчанию, сбрасываем флаг у других
    if (input.isDefault) {
      await db.execute(`UPDATE ai_settings SET is_default = FALSE`);
    }

    const query = `
      INSERT INTO ai_settings (
        id, provider, api_key_encrypted, api_key_last_four, api_key_name, base_url,
        vision_model, text_model, max_tokens, temperature,
        monthly_budget_usd, daily_budget_usd, max_tokens_per_request, max_requests_per_day,
        is_active, is_default, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id,
      input.provider,
      encryptApiKey(input.apiKey),
      getLastFour(input.apiKey),
      input.apiKeyName || null,
      input.baseUrl || null,
      input.visionModel || "openai/gpt-4o",
      input.textModel || "openai/gpt-3.5-turbo",
      input.maxTokens || 1500,
      input.temperature || 0.1,
      input.monthlyBudgetUsd || null,
      input.dailyBudgetUsd || null,
      input.maxTokensPerRequest || 4000,
      input.maxRequestsPerDay || null,
      input.isActive ?? true,
      input.isDefault ?? false,
      input.createdBy || null,
    ];

    await db.execute(query, values);
    console.log(`[AISettingsRepo] ✅ Created AI settings: ${id}`);

    return this.getById(id) as Promise<AISettings>;
  },

  /**
   * Получить настройки по ID
   */
  async getById(id: string): Promise<AISettings | null> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM ai_settings WHERE id = ?`,
      [id],
    );

    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  },

  /**
   * Получить настройки по умолчанию
   */
  async getDefault(): Promise<AISettings | null> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM ai_settings WHERE is_default = TRUE AND is_active = TRUE LIMIT 1`,
    );

    if (!rows || rows.length === 0) {
      // Если нет дефолтных, берём первую активную
      const [fallback] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM ai_settings WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`,
      );
      if (!fallback || fallback.length === 0) return null;
      return this.mapRow(fallback[0]);
    }

    return this.mapRow(rows[0]);
  },

  /**
   * Получить все настройки
   */
  async getAll(): Promise<AISettings[]> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM ai_settings ORDER BY is_default DESC, is_active DESC, created_at DESC`,
    );

    return rows.map(this.mapRow);
  },

  /**
   * Обновить настройки
   */
  async update(id: string, input: UpdateAISettingsInput): Promise<AISettings> {
    const db = getDbPool();

    // Если это настройка по умолчанию, сбрасываем флаг у других
    if (input.isDefault) {
      await db.execute(
        `UPDATE ai_settings SET is_default = FALSE WHERE id != ?`,
        [id],
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.provider !== undefined) {
      updates.push("provider = ?");
      values.push(input.provider);
    }
    if (input.apiKey !== undefined) {
      updates.push("api_key_encrypted = ?");
      values.push(encryptApiKey(input.apiKey));
      updates.push("api_key_last_four = ?");
      values.push(getLastFour(input.apiKey));
    }
    if (input.apiKeyName !== undefined) {
      updates.push("api_key_name = ?");
      values.push(input.apiKeyName);
    }
    if (input.baseUrl !== undefined) {
      updates.push("base_url = ?");
      values.push(input.baseUrl);
    }
    if (input.visionModel !== undefined) {
      updates.push("vision_model = ?");
      values.push(input.visionModel);
    }
    if (input.textModel !== undefined) {
      updates.push("text_model = ?");
      values.push(input.textModel);
    }
    if (input.maxTokens !== undefined) {
      updates.push("max_tokens = ?");
      values.push(input.maxTokens);
    }
    if (input.temperature !== undefined) {
      updates.push("temperature = ?");
      values.push(input.temperature);
    }
    if (input.monthlyBudgetUsd !== undefined) {
      updates.push("monthly_budget_usd = ?");
      values.push(input.monthlyBudgetUsd);
    }
    if (input.dailyBudgetUsd !== undefined) {
      updates.push("daily_budget_usd = ?");
      values.push(input.dailyBudgetUsd);
    }
    if (input.maxTokensPerRequest !== undefined) {
      updates.push("max_tokens_per_request = ?");
      values.push(input.maxTokensPerRequest);
    }
    if (input.maxRequestsPerDay !== undefined) {
      updates.push("max_requests_per_day = ?");
      values.push(input.maxRequestsPerDay);
    }
    if (input.isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(input.isActive);
    }
    if (input.isDefault !== undefined) {
      updates.push("is_default = ?");
      values.push(input.isDefault);
    }
    if (input.updatedBy !== undefined) {
      updates.push("updated_by = ?");
      values.push(input.updatedBy);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.execute(
        `UPDATE ai_settings SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    console.log(`[AISettingsRepo] ✅ Updated AI settings: ${id}`);
    return this.getById(id) as Promise<AISettings>;
  },

  /**
   * Удалить настройки
   */
  async delete(id: string): Promise<boolean> {
    const db = getDbPool();
    const [result] = await db.execute<any>(
      `DELETE FROM ai_settings WHERE id = ?`,
      [id],
    );
    console.log(`[AISettingsRepo] ✅ Deleted AI settings: ${id}`);
    return result.affectedRows > 0;
  },

  /**
   * Получить расшифрованный API ключ
   */
  async getDecryptedApiKey(id: string): Promise<string | null> {
    const settings = await this.getById(id);
    if (!settings) return null;
    return decryptApiKey(settings.apiKeyEncrypted);
  },

  // --------------------------------------------------------------------------
  // Token Usage Tracking
  // --------------------------------------------------------------------------

  /**
   * Записать использование токенов
   */
  async logTokenUsage(data: {
    settingId: string;
    model: string;
    operationType: OperationType;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    certificateLogId?: string;
    userId?: string;
    status?: "success" | "failed" | "partial";
    errorCode?: string;
    errorMessage?: string;
  }): Promise<void> {
    const db = getDbPool();
    const id = uuidv4();

    await db.execute(
      `INSERT INTO ai_token_usage_history (
        id, setting_id, model, operation_type, prompt_tokens, completion_tokens,
        total_tokens, cost_usd, certificate_log_id, user_id, status, error_code, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.settingId,
        data.model,
        data.operationType,
        data.promptTokens,
        data.completionTokens,
        data.totalTokens,
        data.costUsd,
        data.certificateLogId || null,
        data.userId || null,
        data.status || "success",
        data.errorCode || null,
        data.errorMessage || null,
      ],
    );

    // Обновляем счётчики в настройках
    await db.execute(
      `UPDATE ai_settings SET
        total_tokens_used = total_tokens_used + ?,
        total_prompt_tokens = total_prompt_tokens + ?,
        total_completion_tokens = total_completion_tokens + ?,
        total_cost_usd = total_cost_usd + ?,
        tokens_used_today = tokens_used_today + ?,
        tokens_used_this_month = tokens_used_this_month + ?,
        last_used_at = NOW()
      WHERE id = ?`,
      [
        data.totalTokens,
        data.promptTokens,
        data.completionTokens,
        data.costUsd,
        data.totalTokens,
        data.totalTokens,
        data.settingId,
      ],
    );

    console.log(
      `[AISettingsRepo] 📊 Logged ${data.totalTokens} tokens ($${data.costUsd.toFixed(6)})`,
    );
  },

  /**
   * Сбросить дневные счётчики (вызывать ежедневно cron)
   */
  async resetDailyCounters(): Promise<void> {
    const db = getDbPool();
    await db.execute(
      `UPDATE ai_settings SET tokens_used_today = 0 WHERE DATE(last_usage_reset_date) != CURDATE() OR last_usage_reset_date IS NULL`,
    );
    await db.execute(
      `UPDATE ai_settings SET last_usage_reset_date = CURDATE()`,
    );
    console.log(`[AISettingsRepo] 🔄 Reset daily token counters`);
  },

  /**
   * Сбросить месячные счётчики
   */
  async resetMonthlyCounters(): Promise<void> {
    const db = getDbPool();
    await db.execute(`UPDATE ai_settings SET tokens_used_this_month = 0`);
    console.log(`[AISettingsRepo] 🔄 Reset monthly token counters`);
  },

  // --------------------------------------------------------------------------
  // Error Logging
  // --------------------------------------------------------------------------

  /**
   * Логировать ошибку API
   */
  async logApiError(data: {
    settingId?: string;
    errorCode: string;
    errorType: AIErrorType;
    errorMessage: string;
    model?: string;
    tokensRequested?: number;
    tokensAvailable?: number;
    requestPayload?: any;
    responseRaw?: string;
    userId?: string;
  }): Promise<string> {
    const db = getDbPool();
    const id = uuidv4();

    await db.execute(
      `INSERT INTO ai_api_errors (
        id, setting_id, error_code, error_type, error_message,
        model, tokens_requested, tokens_available, request_payload, response_raw, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.settingId || null,
        data.errorCode,
        data.errorType,
        data.errorMessage,
        data.model || null,
        data.tokensRequested || null,
        data.tokensAvailable || null,
        data.requestPayload ? JSON.stringify(data.requestPayload) : null,
        data.responseRaw || null,
        data.userId || null,
      ],
    );

    // Обновляем информацию об ошибке в настройках
    if (data.settingId) {
      await db.execute(
        `UPDATE ai_settings SET last_error_at = NOW(), last_error_message = ? WHERE id = ?`,
        [data.errorMessage, data.settingId],
      );
    }

    console.error(
      `[AISettingsRepo] ❌ Logged API error: ${data.errorType} - ${data.errorCode}`,
    );
    return id;
  },

  /**
   * Получить недавние ошибки
   */
  async getRecentErrors(limit: number = 20): Promise<AIApiError[]> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM ai_api_errors ORDER BY created_at DESC LIMIT ?`,
      [limit.toString()],
    );

    return rows.map((row) => ({
      id: row.id,
      settingId: row.setting_id,
      errorCode: row.error_code,
      errorType: row.error_type as AIErrorType,
      errorMessage: row.error_message,
      model: row.model,
      tokensRequested: row.tokens_requested,
      tokensAvailable: row.tokens_available,
      requestPayload: row.request_payload
        ? JSON.parse(row.request_payload)
        : null,
      responseRaw: row.response_raw,
      userId: row.user_id,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }));
  },

  /**
   * Получить количество ошибок за последние 24 часа
   */
  async getErrorCount24h(): Promise<number> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ai_api_errors WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    );
    return rows[0]?.count || 0;
  },

  /**
   * Получить ошибки сгруппированные по типу
   */
  async getErrorsByType(): Promise<Record<string, number>> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT error_type, COUNT(*) as count 
       FROM ai_api_errors 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY error_type`,
    );

    const result: Record<string, number> = {};
    rows.forEach((row) => {
      result[row.error_type] = row.count;
    });
    return result;
  },

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  /**
   * Полная статистика для дашборда
   */
  async getStats(): Promise<AISettingsStats> {
    const db = getDbPool();

    // Основные счётчики настроек
    const [settingsStats] = await db.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_settings,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_settings,
        SUM(total_tokens_used) as total_tokens_used,
        SUM(total_cost_usd) as total_cost_usd,
        SUM(tokens_used_today) as tokens_used_today,
        SUM(tokens_used_this_month) as tokens_used_this_month
      FROM ai_settings
    `);

    const stats = settingsStats[0];

    // Использование по моделям
    const [usageByModel] = await db.execute<RowDataPacket[]>(`
      SELECT 
        model,
        SUM(total_tokens) as total_tokens,
        SUM(cost_usd) as total_cost,
        COUNT(*) as request_count
      FROM ai_token_usage_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY model
      ORDER BY total_tokens DESC
      LIMIT 10
    `);

    const errorCount24h = await this.getErrorCount24h();
    const errorsByType = await this.getErrorsByType();
    const recentErrors = await this.getRecentErrors(5);

    return {
      totalSettings: stats.total_settings || 0,
      activeSettings: stats.active_settings || 0,
      totalTokensUsed: Number(stats.total_tokens_used) || 0,
      totalCostUsd: Number(stats.total_cost_usd) || 0,
      tokensUsedToday: Number(stats.tokens_used_today) || 0,
      tokensUsedThisMonth: Number(stats.tokens_used_this_month) || 0,
      errorCount24h,
      errorsByType,
      usageByModel: usageByModel.map((row) => ({
        model: row.model,
        totalTokens: Number(row.total_tokens),
        totalCost: Number(row.total_cost),
        requestCount: row.request_count,
      })),
      recentErrors,
    };
  },

  /**
   * Получить историю использования токенов
   */
  async getUsageHistory(
    settingId?: string,
    days: number = 30,
    limit: number = 100,
  ): Promise<TokenUsageLog[]> {
    const db = getDbPool();

    let query = `
      SELECT * FROM ai_token_usage_history 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const values: any[] = [days.toString()];

    if (settingId) {
      query += ` AND setting_id = ?`;
      values.push(settingId);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    values.push(limit.toString());

    const [rows] = await db.execute<RowDataPacket[]>(query, values);

    return rows.map((row) => ({
      id: row.id,
      settingId: row.setting_id,
      model: row.model,
      operationType: row.operation_type as OperationType,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      costUsd: Number(row.cost_usd),
      certificateLogId: row.certificate_log_id,
      userId: row.user_id,
      status: row.status,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }));
  },

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  mapRow(row: any): AISettings {
    return {
      id: row.id,
      provider: row.provider as AIProvider,
      apiKeyEncrypted: row.api_key_encrypted,
      apiKeyLastFour: row.api_key_last_four,
      apiKeyName: row.api_key_name,
      baseUrl: row.base_url,
      visionModel: row.vision_model,
      textModel: row.text_model,
      maxTokens: row.max_tokens,
      temperature: Number(row.temperature),
      monthlyBudgetUsd: row.monthly_budget_usd
        ? Number(row.monthly_budget_usd)
        : null,
      dailyBudgetUsd: row.daily_budget_usd
        ? Number(row.daily_budget_usd)
        : null,
      maxTokensPerRequest: row.max_tokens_per_request,
      maxRequestsPerDay: row.max_requests_per_day,
      isActive: Boolean(row.is_active),
      isDefault: Boolean(row.is_default),
      lastUsedAt: row.last_used_at,
      lastErrorAt: row.last_error_at,
      lastErrorMessage: row.last_error_message,
      totalTokensUsed: Number(row.total_tokens_used),
      totalPromptTokens: Number(row.total_prompt_tokens),
      totalCompletionTokens: Number(row.total_completion_tokens),
      totalCostUsd: Number(row.total_cost_usd),
      tokensUsedToday: Number(row.tokens_used_today),
      tokensUsedThisMonth: Number(row.tokens_used_this_month),
      lastUsageResetDate: row.last_usage_reset_date,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
