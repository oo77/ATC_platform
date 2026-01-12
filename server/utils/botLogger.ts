/**
 * Утилита для логирования запросов Telegram-бота
 */

import { executeQuery } from './db';
import { v4 as uuidv4 } from 'uuid';
import type { ResultSetHeader } from 'mysql2/promise';

export type RequestType = 'command' | 'callback' | 'message';
export type RequestStatus = 'success' | 'error' | 'denied';

export interface LogBotRequestParams {
  representativeId: string;
  chatId: string | number;
  command: string;
  requestType?: RequestType;
  requestData?: Record<string, any>;
  status?: RequestStatus;
  errorMessage?: string;
  responseTimeMs?: number;
}

/**
 * Логировать запрос к Telegram-боту
 */
export async function logBotRequest(params: LogBotRequestParams): Promise<void> {
  try {
    const id = uuidv4();
    const now = new Date();

    await executeQuery<ResultSetHeader>(
      `INSERT INTO telegram_bot_requests 
       (id, representative_id, chat_id, command, request_type, request_data, 
        status, error_message, response_time_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.representativeId,
        typeof params.chatId === 'string' ? parseInt(params.chatId) : params.chatId,
        params.command,
        params.requestType || 'command',
        params.requestData ? JSON.stringify(params.requestData) : null,
        params.status || 'success',
        params.errorMessage || null,
        params.responseTimeMs || null,
        now,
      ]
    );
  } catch (error) {
    console.error('[BotLogger] Ошибка логирования запроса:', error);
    // Не бросаем ошибку, чтобы не прерывать основной процесс
  }
}

/**
 * Получить историю запросов представителя
 */
export async function getBotRequestHistory(
  representativeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const rows = await executeQuery<any[]>(
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
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('[BotLogger] Ошибка получения истории:', error);
    return [];
  }
}

/**
 * Получить статистику запросов представителя
 */
export async function getBotRequestStats(representativeId: string): Promise<{
  total: number;
  success: number;
  error: number;
  denied: number;
  lastRequest: Date | null;
}> {
  try {
    const [stats] = await executeQuery<any[]>(
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
      lastRequest: stats?.last_request || null,
    };
  } catch (error) {
    console.error('[BotLogger] Ошибка получения статистики:', error);
    return {
      total: 0,
      success: 0,
      error: 0,
      denied: 0,
      lastRequest: null,
    };
  }
}

/**
 * Очистить старые логи (старше указанного количества дней)
 */
export async function cleanupOldBotRequests(daysToKeep: number = 90): Promise<number> {
  try {
    const result = await executeQuery<ResultSetHeader>(
      `DELETE FROM telegram_bot_requests 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysToKeep]
    );

    return result.affectedRows;
  } catch (error) {
    console.error('[BotLogger] Ошибка очистки логов:', error);
    return 0;
  }
}
