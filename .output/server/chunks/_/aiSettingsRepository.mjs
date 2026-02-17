import { w as getDbPool } from './nitro.mjs';
import { v4 } from 'uuid';
import crypto from 'crypto';
import 'grammy';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'node:url';
import 'jsonwebtoken';

const getEncryptionKey = () => {
  const key = process.env.AI_SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET || "default-encryption-key-32chars!";
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
};
const IV_LENGTH = 16;
const encryptApiKey = (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};
const decryptApiKey = (encryptedText) => {
  try {
    const [ivHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      getEncryptionKey(),
      iv
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encryptedText;
  }
};
const getLastFour = (apiKey) => {
  if (apiKey.length < 4) return "****";
  return apiKey.slice(-4);
};
const aiSettingsRepository = {
  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------
  /**
   * Создать новые настройки AI
   */
  async create(input) {
    const db = getDbPool();
    const id = v4();
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
      input.maxTokensPerRequest || 4e3,
      input.maxRequestsPerDay || null,
      input.isActive ?? true,
      input.isDefault ?? false,
      input.createdBy || null
    ];
    await db.execute(query, values);
    console.log(`[AISettingsRepo] \u2705 Created AI settings: ${id}`);
    return this.getById(id);
  },
  /**
   * Получить настройки по ID
   */
  async getById(id) {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT * FROM ai_settings WHERE id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  },
  /**
   * Получить настройки по умолчанию
   */
  async getDefault() {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT * FROM ai_settings WHERE is_default = TRUE AND is_active = TRUE LIMIT 1`
    );
    if (!rows || rows.length === 0) {
      const [fallback] = await db.execute(
        `SELECT * FROM ai_settings WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`
      );
      if (!fallback || fallback.length === 0) return null;
      return this.mapRow(fallback[0]);
    }
    return this.mapRow(rows[0]);
  },
  /**
   * Получить все настройки
   */
  async getAll() {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT * FROM ai_settings ORDER BY is_default DESC, is_active DESC, created_at DESC`
    );
    return rows.map(this.mapRow);
  },
  /**
   * Обновить настройки
   */
  async update(id, input) {
    const db = getDbPool();
    if (input.isDefault) {
      await db.execute(
        `UPDATE ai_settings SET is_default = FALSE WHERE id != ?`,
        [id]
      );
    }
    const updates = [];
    const values = [];
    if (input.provider !== void 0) {
      updates.push("provider = ?");
      values.push(input.provider);
    }
    if (input.apiKey !== void 0) {
      updates.push("api_key_encrypted = ?");
      values.push(encryptApiKey(input.apiKey));
      updates.push("api_key_last_four = ?");
      values.push(getLastFour(input.apiKey));
    }
    if (input.apiKeyName !== void 0) {
      updates.push("api_key_name = ?");
      values.push(input.apiKeyName);
    }
    if (input.baseUrl !== void 0) {
      updates.push("base_url = ?");
      values.push(input.baseUrl);
    }
    if (input.visionModel !== void 0) {
      updates.push("vision_model = ?");
      values.push(input.visionModel);
    }
    if (input.textModel !== void 0) {
      updates.push("text_model = ?");
      values.push(input.textModel);
    }
    if (input.maxTokens !== void 0) {
      updates.push("max_tokens = ?");
      values.push(input.maxTokens);
    }
    if (input.temperature !== void 0) {
      updates.push("temperature = ?");
      values.push(input.temperature);
    }
    if (input.monthlyBudgetUsd !== void 0) {
      updates.push("monthly_budget_usd = ?");
      values.push(input.monthlyBudgetUsd);
    }
    if (input.dailyBudgetUsd !== void 0) {
      updates.push("daily_budget_usd = ?");
      values.push(input.dailyBudgetUsd);
    }
    if (input.maxTokensPerRequest !== void 0) {
      updates.push("max_tokens_per_request = ?");
      values.push(input.maxTokensPerRequest);
    }
    if (input.maxRequestsPerDay !== void 0) {
      updates.push("max_requests_per_day = ?");
      values.push(input.maxRequestsPerDay);
    }
    if (input.isActive !== void 0) {
      updates.push("is_active = ?");
      values.push(input.isActive);
    }
    if (input.isDefault !== void 0) {
      updates.push("is_default = ?");
      values.push(input.isDefault);
    }
    if (input.updatedBy !== void 0) {
      updates.push("updated_by = ?");
      values.push(input.updatedBy);
    }
    if (updates.length > 0) {
      values.push(id);
      await db.execute(
        `UPDATE ai_settings SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }
    console.log(`[AISettingsRepo] \u2705 Updated AI settings: ${id}`);
    return this.getById(id);
  },
  /**
   * Удалить настройки
   */
  async delete(id) {
    const db = getDbPool();
    const [result] = await db.execute(
      `DELETE FROM ai_settings WHERE id = ?`,
      [id]
    );
    console.log(`[AISettingsRepo] \u2705 Deleted AI settings: ${id}`);
    return result.affectedRows > 0;
  },
  /**
   * Получить расшифрованный API ключ
   */
  async getDecryptedApiKey(id) {
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
  async logTokenUsage(data) {
    const db = getDbPool();
    const id = v4();
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
        data.errorMessage || null
      ]
    );
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
        data.settingId
      ]
    );
    console.log(
      `[AISettingsRepo] \u{1F4CA} Logged ${data.totalTokens} tokens ($${data.costUsd.toFixed(6)})`
    );
  },
  /**
   * Сбросить дневные счётчики (вызывать ежедневно cron)
   */
  async resetDailyCounters() {
    const db = getDbPool();
    await db.execute(
      `UPDATE ai_settings SET tokens_used_today = 0 WHERE DATE(last_usage_reset_date) != CURDATE() OR last_usage_reset_date IS NULL`
    );
    await db.execute(
      `UPDATE ai_settings SET last_usage_reset_date = CURDATE()`
    );
    console.log(`[AISettingsRepo] \u{1F504} Reset daily token counters`);
  },
  /**
   * Сбросить месячные счётчики
   */
  async resetMonthlyCounters() {
    const db = getDbPool();
    await db.execute(`UPDATE ai_settings SET tokens_used_this_month = 0`);
    console.log(`[AISettingsRepo] \u{1F504} Reset monthly token counters`);
  },
  // --------------------------------------------------------------------------
  // Error Logging
  // --------------------------------------------------------------------------
  /**
   * Логировать ошибку API
   */
  async logApiError(data) {
    const db = getDbPool();
    const id = v4();
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
        data.userId || null
      ]
    );
    if (data.settingId) {
      await db.execute(
        `UPDATE ai_settings SET last_error_at = NOW(), last_error_message = ? WHERE id = ?`,
        [data.errorMessage, data.settingId]
      );
    }
    console.error(
      `[AISettingsRepo] \u274C Logged API error: ${data.errorType} - ${data.errorCode}`
    );
    return id;
  },
  /**
   * Получить недавние ошибки
   */
  async getRecentErrors(limit = 20) {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT * FROM ai_api_errors ORDER BY created_at DESC LIMIT ?`,
      [limit.toString()]
    );
    return rows.map((row) => ({
      id: row.id,
      settingId: row.setting_id,
      errorCode: row.error_code,
      errorType: row.error_type,
      errorMessage: row.error_message,
      model: row.model,
      tokensRequested: row.tokens_requested,
      tokensAvailable: row.tokens_available,
      requestPayload: row.request_payload ? JSON.parse(row.request_payload) : null,
      responseRaw: row.response_raw,
      userId: row.user_id,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at
    }));
  },
  /**
   * Получить количество ошибок за последние 24 часа
   */
  async getErrorCount24h() {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM ai_api_errors WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    return rows[0]?.count || 0;
  },
  /**
   * Получить ошибки сгруппированные по типу
   */
  async getErrorsByType() {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT error_type, COUNT(*) as count 
       FROM ai_api_errors 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY error_type`
    );
    const result = {};
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
  async getStats() {
    const db = getDbPool();
    const [settingsStats] = await db.execute(`
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
    const [usageByModel] = await db.execute(`
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
        requestCount: row.request_count
      })),
      recentErrors
    };
  },
  /**
   * Получить историю использования токенов
   */
  async getUsageHistory(settingId, days = 30, limit = 100) {
    const db = getDbPool();
    let query = `
      SELECT * FROM ai_token_usage_history 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const values = [days.toString()];
    if (settingId) {
      query += ` AND setting_id = ?`;
      values.push(settingId);
    }
    query += ` ORDER BY created_at DESC LIMIT ?`;
    values.push(limit.toString());
    const [rows] = await db.execute(query, values);
    return rows.map((row) => ({
      id: row.id,
      settingId: row.setting_id,
      model: row.model,
      operationType: row.operation_type,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      costUsd: Number(row.cost_usd),
      certificateLogId: row.certificate_log_id,
      userId: row.user_id,
      status: row.status,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      createdAt: row.created_at
    }));
  },
  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------
  mapRow(row) {
    return {
      id: row.id,
      provider: row.provider,
      apiKeyEncrypted: row.api_key_encrypted,
      apiKeyLastFour: row.api_key_last_four,
      apiKeyName: row.api_key_name,
      baseUrl: row.base_url,
      visionModel: row.vision_model,
      textModel: row.text_model,
      maxTokens: row.max_tokens,
      temperature: Number(row.temperature),
      monthlyBudgetUsd: row.monthly_budget_usd ? Number(row.monthly_budget_usd) : null,
      dailyBudgetUsd: row.daily_budget_usd ? Number(row.daily_budget_usd) : null,
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
      updatedAt: row.updated_at
    };
  }
};

export { aiSettingsRepository };
//# sourceMappingURL=aiSettingsRepository.mjs.map
