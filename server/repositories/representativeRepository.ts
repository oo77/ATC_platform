/**
 * Репозиторий для работы с представителями организаций
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ТИПЫ
// ============================================================================

export type RepresentativeStatus = 'pending' | 'approved' | 'blocked';

/**
 * Разрешения представителя организации
 */
export interface RepresentativePermissions {
  /** Может просматривать список слушателей */
  can_view_students: boolean;
  /** Может просматривать расписание */
  can_view_schedule: boolean;
  /** Может просматривать сертификаты */
  can_view_certificates: boolean;
  /** Может запрашивать файлы сертификатов */
  can_request_certificates: boolean;
}

export interface Representative {
  id: string;
  organizationId: string;
  organizationName?: string;
  fullName: string;
  phone: string;
  telegramChatId: string | null;
  telegramUsername: string | null;
  status: RepresentativeStatus;
  accessGroups: string[] | null;
  permissions: RepresentativePermissions;
  notificationsEnabled: boolean;
  canReceiveNotifications: boolean;
  lastActivityAt: Date | null;
  approvedBy: string | null;
  approvedByName?: string;
  approvedAt: Date | null;
  blockedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRepresentativeInput {
  organizationId: string;
  fullName: string;
  phone: string;
  telegramChatId?: string;
  telegramUsername?: string;
}

export interface UpdateRepresentativeInput {
  fullName?: string;
  phone?: string;
  accessGroups?: string[] | null;
  notificationsEnabled?: boolean;
  canReceiveNotifications?: boolean;
  permissions?: Partial<RepresentativePermissions>;
}

export interface RepresentativePaginationParams {
  page?: number;
  limit?: number;
  status?: RepresentativeStatus;
  organizationId?: string;
  search?: string;
}

export interface PaginatedRepresentatives {
  data: Representative[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RepresentativeStats {
  total: number;
  pending: number;
  approved: number;
  blocked: number;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface RepresentativeRow extends RowDataPacket {
  id: string;
  organization_id: string;
  organization_name?: string;
  full_name: string;
  phone: string;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  status: RepresentativeStatus;
  access_groups: string | null;
  permissions: string | null;
  notifications_enabled: number;
  can_receive_notifications: number;
  last_activity_at: Date | null;
  approved_by: string | null;
  approved_by_name?: string;
  approved_at: Date | null;
  blocked_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ
// ============================================================================

const DEFAULT_PERMISSIONS: RepresentativePermissions = {
  can_view_students: true,
  can_view_schedule: true,
  can_view_certificates: true,
  can_request_certificates: true,
};

function mapRowToRepresentative(row: RepresentativeRow): Representative {
  let accessGroups: string[] | null = null;
  if (row.access_groups) {
    try {
      accessGroups = JSON.parse(row.access_groups);
    } catch {
      accessGroups = null;
    }
  }

  let permissions: RepresentativePermissions = { ...DEFAULT_PERMISSIONS };
  if (row.permissions) {
    try {
      const parsed = JSON.parse(row.permissions);
      permissions = {
        can_view_students: parsed.can_view_students ?? true,
        can_view_schedule: parsed.can_view_schedule ?? true,
        can_view_certificates: parsed.can_view_certificates ?? true,
        can_request_certificates: parsed.can_request_certificates ?? true,
      };
    } catch {
      permissions = { ...DEFAULT_PERMISSIONS };
    }
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    fullName: row.full_name,
    phone: row.phone,
    telegramChatId: row.telegram_chat_id,
    telegramUsername: row.telegram_username,
    status: row.status,
    accessGroups,
    permissions,
    notificationsEnabled: Boolean(row.notifications_enabled),
    canReceiveNotifications: Boolean(row.can_receive_notifications ?? true),
    lastActivityAt: row.last_activity_at,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    approvedAt: row.approved_at,
    blockedReason: row.blocked_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// ПУБЛИЧНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Получить всех представителей с пагинацией
 */
export async function getRepresentativesPaginated(
  params: RepresentativePaginationParams = {}
): Promise<PaginatedRepresentatives> {
  const { page = 1, limit = 20, status, organizationId, search } = params;

  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (status) {
    conditions.push('r.status = ?');
    queryParams.push(status);
  }

  if (organizationId) {
    conditions.push('r.organization_id = ?');
    queryParams.push(organizationId);
  }

  if (search) {
    conditions.push('(r.full_name LIKE ? OR r.phone LIKE ? OR r.telegram_username LIKE ? OR o.name LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Подсчёт общего количества
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    ${whereClause}
  `;
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Получение данных с пагинацией
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      r.*,
      o.name as organization_name,
      u.name as approved_by_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    LEFT JOIN users u ON r.approved_by = u.id
    ${whereClause}
    ORDER BY 
      CASE r.status 
        WHEN 'pending' THEN 0 
        WHEN 'approved' THEN 1 
        WHEN 'blocked' THEN 2 
      END,
      r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery<RepresentativeRow[]>(dataQuery, dataParams);

  return {
    data: rows.map(mapRowToRepresentative),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получить представителя по ID
 */
export async function getRepresentativeById(id: string): Promise<Representative | null> {
  const rows = await executeQuery<RepresentativeRow[]>(
    `SELECT 
      r.*,
      o.name as organization_name,
      u.name as approved_by_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    LEFT JOIN users u ON r.approved_by = u.id
    WHERE r.id = ? LIMIT 1`,
    [id]
  );

  return rows.length > 0 ? mapRowToRepresentative(rows[0]) : null;
}

/**
 * Получить представителя по Telegram Chat ID
 */
export async function getRepresentativeByTelegramChatId(chatId: string): Promise<Representative | null> {
  const rows = await executeQuery<RepresentativeRow[]>(
    `SELECT 
      r.*,
      o.name as organization_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    WHERE r.telegram_chat_id = ? LIMIT 1`,
    [chatId]
  );

  return rows.length > 0 ? mapRowToRepresentative(rows[0]) : null;
}

/**
 * Получить представителей по организации
 */
export async function getRepresentativesByOrganization(organizationId: string): Promise<Representative[]> {
  const rows = await executeQuery<RepresentativeRow[]>(
    `SELECT 
      r.*,
      o.name as organization_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    WHERE r.organization_id = ?
    ORDER BY r.created_at DESC`,
    [organizationId]
  );

  return rows.map(mapRowToRepresentative);
}

/**
 * Получить ожидающих одобрения представителей
 */
export async function getPendingRepresentatives(): Promise<Representative[]> {
  const rows = await executeQuery<RepresentativeRow[]>(
    `SELECT 
      r.*,
      o.name as organization_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC`
  );

  return rows.map(mapRowToRepresentative);
}

/**
 * Получить количество ожидающих заявок
 */
export async function getPendingCount(): Promise<number> {
  const result = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM organization_representatives WHERE status = 'pending'`
  );
  return result[0]?.total || 0;
}

/**
 * Создать представителя (из Telegram бота)
 */
export async function createRepresentative(data: CreateRepresentativeInput): Promise<Representative> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery(
    `INSERT INTO organization_representatives 
      (id, organization_id, full_name, phone, telegram_chat_id, telegram_username, status, notifications_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, ?, ?)`,
    [
      id,
      data.organizationId,
      data.fullName,
      data.phone,
      data.telegramChatId || null,
      data.telegramUsername || null,
      now,
      now,
    ]
  );

  const representative = await getRepresentativeById(id);
  if (!representative) {
    throw new Error('Failed to create representative');
  }

  return representative;
}

/**
 * Обновить представителя
 */
export async function updateRepresentative(
  id: string,
  data: UpdateRepresentativeInput
): Promise<Representative | null> {
  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [new Date()];

  if (data.fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(data.fullName);
  }

  if (data.phone !== undefined) {
    updates.push('phone = ?');
    params.push(data.phone);
  }

  if (data.accessGroups !== undefined) {
    updates.push('access_groups = ?');
    params.push(data.accessGroups ? JSON.stringify(data.accessGroups) : null);
  }

  if (data.notificationsEnabled !== undefined) {
    updates.push('notifications_enabled = ?');
    params.push(data.notificationsEnabled ? 1 : 0);
  }

  if (data.canReceiveNotifications !== undefined) {
    updates.push('can_receive_notifications = ?');
    params.push(data.canReceiveNotifications ? 1 : 0);
  }

  if (data.permissions !== undefined) {
    updates.push('permissions = ?');
    params.push(JSON.stringify(data.permissions));
  }

  params.push(id);

  await executeQuery(
    `UPDATE organization_representatives SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return getRepresentativeById(id);
}

/**
 * Одобрить представителя
 */
export async function approveRepresentative(
  id: string,
  approvedBy: string,
  accessGroups?: string[]
): Promise<Representative | null> {
  const now = new Date();

  await executeQuery(
    `UPDATE organization_representatives 
     SET status = 'approved', 
         approved_by = ?, 
         approved_at = ?,
         access_groups = ?,
         blocked_reason = NULL,
         updated_at = ?
     WHERE id = ?`,
    [
      approvedBy,
      now,
      accessGroups ? JSON.stringify(accessGroups) : null,
      now,
      id,
    ]
  );

  return getRepresentativeById(id);
}

/**
 * Заблокировать представителя
 */
export async function blockRepresentative(
  id: string,
  blockedBy: string,
  reason: string
): Promise<Representative | null> {
  const now = new Date();

  await executeQuery(
    `UPDATE organization_representatives 
     SET status = 'blocked', 
         blocked_reason = ?,
         approved_by = ?,
         updated_at = ?
     WHERE id = ?`,
    [reason, blockedBy, now, id]
  );

  return getRepresentativeById(id);
}

/**
 * Удалить представителя
 */
export async function deleteRepresentative(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM organization_representatives WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
}

/**
 * Обновить время последней активности
 */
export async function updateLastActivity(id: string): Promise<void> {
  await executeQuery(
    'UPDATE organization_representatives SET last_activity_at = ? WHERE id = ?',
    [new Date(), id]
  );
}

/**
 * Получить статистику представителей
 */
export async function getRepresentativeStats(): Promise<RepresentativeStats> {
  const rows = await executeQuery<(RowDataPacket & { status: RepresentativeStatus; count: number })[]>(
    `SELECT status, COUNT(*) as count 
     FROM organization_representatives 
     GROUP BY status`
  );

  const stats: RepresentativeStats = {
    total: 0,
    pending: 0,
    approved: 0,
    blocked: 0,
  };

  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }

  return stats;
}

/**
 * Проверить существование представителя по Telegram Chat ID
 */
export async function representativeExistsByTelegramChatId(chatId: string): Promise<boolean> {
  const result = await executeQuery<CountRow[]>(
    'SELECT COUNT(*) as total FROM organization_representatives WHERE telegram_chat_id = ?',
    [chatId]
  );
  return (result[0]?.total || 0) > 0;
}
