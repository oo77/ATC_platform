import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';
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
import 'crypto';
import 'jsonwebtoken';

async function logBotRequest(params) {
  try {
    const id = v4();
    const now = /* @__PURE__ */ new Date();
    await executeQuery(
      `INSERT INTO telegram_bot_requests 
       (id, representative_id, chat_id, command, request_type, request_data, 
        status, error_message, response_time_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.representativeId,
        typeof params.chatId === "string" ? parseInt(params.chatId) : params.chatId,
        params.command,
        params.requestType || "command",
        params.requestData ? JSON.stringify(params.requestData) : null,
        params.status || "success",
        params.errorMessage || null,
        params.responseTimeMs || null,
        now
      ]
    );
  } catch (error) {
    console.error("[BotLogger] \u041E\u0448\u0438\u0431\u043A\u0430 \u043B\u043E\u0433\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0437\u0430\u043F\u0440\u043E\u0441\u0430:", error);
  }
}
async function getBotRequestHistory(representativeId, limit = 50, offset = 0) {
  try {
    const rows = await executeQuery(
      `SELECT * FROM telegram_bot_requests 
       WHERE representative_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [representativeId, limit, offset]
    );
    return rows.map((row) => ({
      id: row.id,
      representativeId: row.representative_id,
      chatId: row.chat_id,
      command: row.command,
      requestType: row.request_type,
      requestData: row.request_data ? JSON.parse(row.request_data) : null,
      status: row.status,
      errorMessage: row.error_message,
      responseTimeMs: row.response_time_ms,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error("[BotLogger] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438:", error);
    return [];
  }
}
async function getBotRequestStats(representativeId) {
  try {
    const [stats] = await executeQuery(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
         SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
         SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied,
         MAX(created_at) as last_request
       FROM telegram_bot_requests 
       WHERE representative_id = ?`,
      [representativeId]
    );
    return {
      total: stats?.total || 0,
      success: stats?.success || 0,
      error: stats?.error || 0,
      denied: stats?.denied || 0,
      lastRequest: stats?.last_request || null
    };
  } catch (error) {
    console.error("[BotLogger] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438:", error);
    return {
      total: 0,
      success: 0,
      error: 0,
      denied: 0,
      lastRequest: null
    };
  }
}

export { getBotRequestHistory, getBotRequestStats, logBotRequest };
//# sourceMappingURL=botLogger.mjs.map
