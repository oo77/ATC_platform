/**
 * Репозиторий для работы с сессиями Telegram бота
 * Используется для хранения состояния FSM (конечного автомата)
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ============================================================================
// ТИПЫ
// ============================================================================

export type SessionState = 
  | 'idle'
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_organization'
  | 'pending_approval'
  | 'completed';

export interface TelegramSession {
  id: string;
  chatId: string;
  state: SessionState;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  chatId: string;
  state?: SessionState;
  data?: Record<string, any>;
}

export interface UpdateSessionInput {
  state?: SessionState;
  data?: Record<string, any>;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface SessionRow extends RowDataPacket {
  id: string;
  chat_id: string;
  state: SessionState;
  data: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToSession(row: SessionRow): TelegramSession {
  let data: Record<string, any> = {};
  
  if (row.data) {
    try {
      data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch {
      data = {};
    }
  }

  return {
    id: row.id,
    chatId: row.chat_id,
    state: row.state,
    data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// ПУБЛИЧНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить сессию по chat_id
 */
export async function getSession(chatId: string): Promise<TelegramSession | null> {
  const rows = await executeQuery<SessionRow[]>(
    'SELECT * FROM telegram_bot_sessions WHERE chat_id = ? LIMIT 1',
    [chatId]
  );

  return rows.length > 0 ? mapRowToSession(rows[0]) : null;
}

/**
 * Создать новую сессию
 */
export async function createSession(input: CreateSessionInput): Promise<TelegramSession> {
  const id = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const now = new Date();
  const state = input.state || 'idle';
  const dataJson = input.data ? JSON.stringify(input.data) : '{}';

  await executeQuery(
    `INSERT INTO telegram_bot_sessions (id, chat_id, state, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.chatId, state, dataJson, now, now]
  );

  const session = await getSession(input.chatId);
  if (!session) {
    throw new Error('Failed to create session');
  }

  return session;
}

/**
 * Обновить сессию
 */
export async function updateSession(
  chatId: string,
  input: UpdateSessionInput
): Promise<TelegramSession | null> {
  const existing = await getSession(chatId);
  if (!existing) {
    return null;
  }

  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [new Date()];

  if (input.state !== undefined) {
    updates.push('state = ?');
    params.push(input.state);
  }

  if (input.data !== undefined) {
    updates.push('data = ?');
    params.push(JSON.stringify(input.data));
  }

  params.push(chatId);

  await executeQuery(
    `UPDATE telegram_bot_sessions SET ${updates.join(', ')} WHERE chat_id = ?`,
    params
  );

  return getSession(chatId);
}

/**
 * Удалить сессию
 */
export async function deleteSession(chatId: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM telegram_bot_sessions WHERE chat_id = ?',
    [chatId]
  );

  return result.affectedRows > 0;
}

/**
 * Очистить старые сессии (старше указанного количества дней)
 */
export async function cleanupOldSessions(daysToKeep: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM telegram_bot_sessions WHERE updated_at < ?',
    [cutoffDate]
  );

  return result.affectedRows;
}

/**
 * Получить или создать сессию
 */
export async function getOrCreateSession(chatId: string): Promise<TelegramSession> {
  let session = await getSession(chatId);
  
  if (!session) {
    session = await createSession({ chatId, state: 'idle', data: {} });
  }

  return session;
}

/**
 * Обновить данные сессии (merge с существующими)
 */
export async function updateSessionData(
  chatId: string,
  newData: Record<string, any>
): Promise<TelegramSession | null> {
  const session = await getSession(chatId);
  if (!session) {
    return null;
  }

  const mergedData = { ...session.data, ...newData };
  return updateSession(chatId, { data: mergedData });
}

/**
 * Сбросить сессию в начальное состояние
 */
export async function resetSession(chatId: string): Promise<TelegramSession | null> {
  return updateSession(chatId, { state: 'idle', data: {} });
}
