/**
 * Репозиторий для работы с файлами в MySQL
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import type { FileCategory } from '../utils/storage';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export type FileAccessLevel = 'public' | 'authenticated' | 'owner' | 'admin';

export interface FileRecord {
  id: number;
  uuid: string;
  filename: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
  storagePath: string;
  fullPath: string;
  category: FileCategory;
  userId: number | null;
  courseId: number | null;
  groupId: number | null;
  assignmentId: number | null;
  metadata: Record<string, any> | null;
  isPublic: boolean;
  accessLevel: FileAccessLevel;
  uploadedBy: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateFileInput {
  uuid: string;
  filename: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
  storagePath: string;
  fullPath: string;
  category: FileCategory;
  folderId?: number | null;
  userId?: number | null;
  courseId?: number | null;
  groupId?: number | null;
  assignmentId?: number | null;
  metadata?: Record<string, any> | null;
  isPublic?: boolean;
  accessLevel?: FileAccessLevel;
  uploadedBy: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: FileCategory;
  userId?: number;
  courseId?: number;
  groupId?: number;
  uploadedBy?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Row types для MySQL
interface FileRow extends RowDataPacket {
  id: number;
  uuid: string;
  filename: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  extension: string;
  storage_path: string;
  full_path: string;
  category: FileCategory;
  user_id: number | null;
  course_id: number | null;
  group_id: number | null;
  assignment_id: number | null;
  metadata: string | null;
  is_public: boolean;
  access_level: FileAccessLevel;
  uploaded_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// МАППИНГ БД -> МОДЕЛЬ
// ============================================================================

function mapRowToFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    filename: row.filename,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    extension: row.extension,
    storagePath: row.storage_path,
    fullPath: row.full_path,
    category: row.category,
    userId: row.user_id,
    courseId: row.course_id,
    groupId: row.group_id,
    assignmentId: row.assignment_id,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    isPublic: row.is_public,
    accessLevel: row.access_level,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Создать запись о файле
 */
export async function createFile(data: CreateFileInput): Promise<FileRecord> {
  const now = new Date();

  await executeQuery(
    `INSERT INTO files (
      uuid, filename, stored_name, mime_type, size_bytes, extension,
      storage_path, full_path, category, folder_id,
      user_id, course_id, group_id, assignment_id, metadata,
      is_public, access_level, uploaded_by,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.uuid,
      data.filename,
      data.storedName,
      data.mimeType,
      data.sizeBytes,
      data.extension,
      data.storagePath,
      data.fullPath,
      data.category,
      data.folderId || null,
      data.userId || null,
      data.courseId || null,
      data.groupId || null,
      data.assignmentId || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.isPublic || false,
      data.accessLevel || 'authenticated',
      data.uploadedBy,
      now,
      now,
    ]
  );

  // Возвращаем созданный файл
  const file = await getFileByUuid(data.uuid);
  if (!file) {
    throw new Error('Failed to create file record');
  }

  return file;
}

/**
 * Получить файл по UUID
 */
export async function getFileByUuid(uuid: string): Promise<FileRecord | null> {
  const rows = await executeQuery<FileRow[]>(
    'SELECT * FROM files WHERE uuid = ? AND deleted_at IS NULL LIMIT 1',
    [uuid]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToFile(rows[0]);
}

/**
 * Получить файлы с пагинацией и фильтрацией
 */
export async function getFilesPaginated(params: PaginationParams = {}): Promise<PaginatedResult<FileRecord>> {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    userId,
    courseId,
    groupId,
    uploadedBy,
  } = params;

  // Строим WHERE условия
  const conditions: string[] = ['deleted_at IS NULL'];
  const queryParams: any[] = [];

  // Универсальный поиск по имени файла
  if (search) {
    conditions.push('filename LIKE ?');
    queryParams.push(`%${search}%`);
  }

  // Фильтр по категории
  if (category) {
    conditions.push('category = ?');
    queryParams.push(category);
  }

  // Фильтр по пользователю
  if (userId) {
    conditions.push('user_id = ?');
    queryParams.push(userId);
  }

  // Фильтр по курсу
  if (courseId) {
    conditions.push('course_id = ?');
    queryParams.push(courseId);
  }

  // Фильтр по группе
  if (groupId) {
    conditions.push('group_id = ?');
    queryParams.push(groupId);
  }

  // Фильтр по загрузившему
  if (uploadedBy) {
    conditions.push('uploaded_by = ?');
    queryParams.push(uploadedBy);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Получаем общее количество
  const countQuery = `SELECT COUNT(*) as total FROM files ${whereClause}`;
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Получаем данные с пагинацией
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM files 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery<FileRow[]>(dataQuery, dataParams);

  const files = rows.map(mapRowToFile);

  return {
    data: files,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Удалить файл (soft delete)
 */
export async function deleteFile(uuid: string): Promise<boolean> {
  const now = new Date();
  
  const result = await executeQuery<ResultSetHeader>(
    'UPDATE files SET deleted_at = ? WHERE uuid = ? AND deleted_at IS NULL',
    [now, uuid]
  );

  return result.affectedRows > 0;
}

/**
 * Получить файлы по связанной сущности
 */
export async function getFilesByRelatedEntity(
  entityType: 'user' | 'course' | 'group' | 'assignment',
  entityId: number
): Promise<FileRecord[]> {
  let column: string;
  
  switch (entityType) {
    case 'user':
      column = 'user_id';
      break;
    case 'course':
      column = 'course_id';
      break;
    case 'group':
      column = 'group_id';
      break;
    case 'assignment':
      column = 'assignment_id';
      break;
  }

  const rows = await executeQuery<FileRow[]>(
    `SELECT * FROM files WHERE ${column} = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    [entityId]
  );

  return rows.map(mapRowToFile);
}

/**
 * Получить файлы по категории
 */
export async function getFilesByCategory(category: FileCategory): Promise<FileRecord[]> {
  const rows = await executeQuery<FileRow[]>(
    'SELECT * FROM files WHERE category = ? AND deleted_at IS NULL ORDER BY created_at DESC',
    [category]
  );

  return rows.map(mapRowToFile);
}

/**
 * Обновить файл
 */
export async function updateFile(id: number, updates: Partial<{ filename: string }>): Promise<boolean> {
  const now = new Date();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.filename !== undefined) {
    fields.push('filename = ?');
    values.push(updates.filename);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const query = `UPDATE files SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  const result = await executeQuery<ResultSetHeader>(query, values);

  return result.affectedRows > 0;
}
