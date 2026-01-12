/**
 * Репозиторий для работы с журналом действий в MySQL
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type {
  ActivityLog,
  CreateActivityLogInput,
  ActivityLogPaginationParams,
  PaginatedActivityLogs,
  ActionType,
  EntityType
} from '../types/activityLog';

// ============================================================================
// ROW TYPES
// ============================================================================

interface ActivityLogRow extends RowDataPacket {
  id: number;
  user_id: string;
  user_name?: string;      // Из JOIN с users
  user_email?: string;     // Из JOIN с users
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

function mapRowToActivityLog(row: ActivityLogRow): ActivityLog {
  let details: Record<string, any> | null = null;

  if (row.details) {
    try {
      details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
    } catch {
      details = null;
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

// ============================================================================
// ПУБЛИЧНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Создать запись в журнале действий
 */
export async function createActivityLog(data: CreateActivityLogInput): Promise<ActivityLog> {
  const detailsJson = data.details ? JSON.stringify(data.details) : null;

  // Отладка: логируем что именно пытаемся записать
  console.log('[createActivityLog] Attempting to insert:', {
    userId: data.userId,
    actionType: data.actionType,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
  });

  const result = await executeQuery<ResultSetHeader>(
    `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, entity_name, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.actionType,
      data.entityType,
      data.entityId || null,
      data.entityName || null,
      detailsJson,
      data.ipAddress || null,
      data.userAgent || null,
    ]
  );

  const rows = await executeQuery<ActivityLogRow[]>(
    'SELECT * FROM activity_logs WHERE id = ?',
    [result.insertId]
  );

  return mapRowToActivityLog(rows[0]);
}

/**
 * Получить журнал действий с пагинацией и фильтрацией
 */
export async function getActivityLogsPaginated(
  params: ActivityLogPaginationParams = {}
): Promise<PaginatedActivityLogs> {
  const {
    page = 1,
    limit = 20,
    userId,
    actionType,
    entityType,
    startDate,
    endDate,
  } = params;

  // Строим WHERE условия
  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (userId) {
    conditions.push('al.user_id = ?');
    queryParams.push(userId);
  }

  if (actionType) {
    conditions.push('al.action_type = ?');
    queryParams.push(actionType);
  }

  if (entityType) {
    conditions.push('al.entity_type = ?');
    queryParams.push(entityType);
  }

  if (startDate) {
    conditions.push('al.created_at >= ?');
    const date = startDate instanceof Date ? startDate : new Date(startDate);
    queryParams.push(date);
  }

  if (endDate) {
    conditions.push('al.created_at <= ?');
    const date = endDate instanceof Date ? endDate : new Date(endDate);
    queryParams.push(date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Получаем общее количество
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM activity_logs al
    ${whereClause}
  `;
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Получаем данные с пагинацией и JOIN с users для получения имени
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      al.*,
      u.name as user_name,
      u.email as user_email
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause} 
    ORDER BY al.created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery<ActivityLogRow[]>(dataQuery, dataParams);

  return {
    data: rows.map(mapRowToActivityLog),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получить журнал действий конкретного пользователя
 */
export async function getActivityLogsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedActivityLogs> {
  return getActivityLogsPaginated({ userId, page, limit });
}

/**
 * Получить последние действия пользователя
 */
export async function getRecentActivityByUserId(
  userId: string,
  limit: number = 10
): Promise<ActivityLog[]> {
  const rows = await executeQuery<ActivityLogRow[]>(
    `SELECT * FROM activity_logs 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [userId, limit]
  );

  return rows.map(mapRowToActivityLog);
}

/**
 * Удалить старые записи журнала
 * @param daysToKeep - количество дней для хранения (по умолчанию 365)
 */
export async function deleteOldActivityLogs(daysToKeep: number = 365): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM activity_logs WHERE created_at < ?',
    [cutoffDate]
  );

  return result.affectedRows;
}

/**
 * Получить статистику действий пользователя
 */
export async function getUserActivityStats(userId: string): Promise<{
  totalActions: number;
  actionsByType: Record<ActionType, number>;
  lastActivity: Date | null;
}> {
  // Общее количество действий
  const totalRows = await executeQuery<CountRow[]>(
    'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?',
    [userId]
  );
  const totalActions = totalRows[0]?.total || 0;

  // Действия по типам
  const actionRows = await executeQuery<(RowDataPacket & { action_type: ActionType; count: number })[]>(
    `SELECT action_type, COUNT(*) as count 
     FROM activity_logs 
     WHERE user_id = ? 
     GROUP BY action_type`,
    [userId]
  );

  const actionsByType: Record<ActionType, number> = {
    CREATE: 0,
    UPDATE: 0,
    DELETE: 0,
    VIEW: 0,
    LOGIN: 0,
    LOGOUT: 0,
    IMPORT: 0,
    EXPORT: 0,
    APPROVE: 0,
    REJECT: 0,
    BLOCK: 0,
    UNBLOCK: 0,
    REVOKE: 0,
    ISSUE: 0,
    RESET_PASSWORD: 0,
    ASSIGN: 0,
    UNASSIGN: 0,
  };

  for (const row of actionRows) {
    actionsByType[row.action_type] = row.count;
  }

  // Последняя активность
  const lastRows = await executeQuery<ActivityLogRow[]>(
    `SELECT created_at FROM activity_logs 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );
  const lastActivity = lastRows.length > 0 ? lastRows[0].created_at : null;

  return {
    totalActions,
    actionsByType,
    lastActivity,
  };
}
