/**
 * Репозиторий для работы с папками в MySQL
 */

import { executeQuery } from '../utils/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface Folder {
  id: number;
  uuid: string;
  name: string;
  parentId: number | null;
  path: string;
  userId: number | null;
  isSystem: boolean;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateFolderInput {
  name: string;
  parentId?: number | null;
  userId?: number | null;
  isSystem?: boolean;
}

// Row types для MySQL
interface FolderRow extends RowDataPacket {
  id: number;
  uuid: string;
  name: string;
  parent_id: number | null;
  path: string;
  user_id: number | null;
  is_system: boolean;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// МАППИНГ БД -> МОДЕЛЬ
// ============================================================================

function mapRowToFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    parentId: row.parent_id,
    path: row.path,
    userId: row.user_id,
    isSystem: row.is_system,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Создать папку
 */
export async function createFolder(data: CreateFolderInput): Promise<Folder> {
  const uuid = uuidv4();
  const now = new Date();

  // Получение пути родительской папки
  let parentPath = '';
  if (data.parentId) {
    const parent = await getFolderById(data.parentId);
    if (!parent) {
      throw new Error('Parent folder not found');
    }
    parentPath = parent.path;
  }

  // Формирование полного пути
  const fullPath = parentPath ? `${parentPath}/${data.name}` : `/${data.name}`;

  // Создание записи в БД
  await executeQuery(
    `INSERT INTO folders (uuid, name, parent_id, path, user_id, is_system, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid, data.name, data.parentId || null, fullPath, data.userId || null, data.isSystem || false, now, now]
  );

  // Создание физической папки в storage/uploads
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Убираем начальный слеш и формируем путь к физической папке
    const relativePath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
    const physicalPath = path.resolve(process.cwd(), 'storage/uploads', relativePath);
    
    // Создаем папку (recursive: true создаст все родительские папки)
    await fs.mkdir(physicalPath, { recursive: true });
    
    console.log(`✓ Физическая папка создана: ${physicalPath}`);
  } catch (error) {
    console.error('Ошибка создания физической папки:', error);
    // Не бросаем ошибку, так как запись в БД уже создана
  }

  const folder = await getFolderByUuid(uuid);
  if (!folder) {
    throw new Error('Failed to create folder');
  }

  return folder;
}

/**
 * Получить папку по ID
 */
export async function getFolderById(id: number): Promise<Folder | null> {
  const rows = await executeQuery<FolderRow[]>(
    'SELECT * FROM folders WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToFolder(rows[0]);
}

/**
 * Получить папку по UUID
 */
export async function getFolderByUuid(uuid: string): Promise<Folder | null> {
  const rows = await executeQuery<FolderRow[]>(
    'SELECT * FROM folders WHERE uuid = ? AND deleted_at IS NULL LIMIT 1',
    [uuid]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToFolder(rows[0]);
}

/**
 * Получить папку по пути
 */
export async function getFolderByPath(path: string): Promise<Folder | null> {
  const rows = await executeQuery<FolderRow[]>(
    'SELECT * FROM folders WHERE path = ? AND deleted_at IS NULL LIMIT 1',
    [path]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToFolder(rows[0]);
}

/**
 * Получить подпапки
 */
export async function getSubFolders(parentId: number | null = null): Promise<Folder[]> {
  const query = parentId === null
    ? 'SELECT * FROM folders WHERE parent_id IS NULL AND deleted_at IS NULL ORDER BY is_system DESC, name ASC'
    : 'SELECT * FROM folders WHERE parent_id = ? AND deleted_at IS NULL ORDER BY is_system DESC, name ASC';

  const params = parentId === null ? [] : [parentId];
  const rows = await executeQuery<FolderRow[]>(query, params);

  return rows.map(mapRowToFolder);
}

/**
 * Получить корневые папки
 */
export async function getRootFolders(): Promise<Folder[]> {
  return getSubFolders(null);
}

/**
 * Переименовать папку
 */
export async function renameFolder(id: number, newName: string): Promise<boolean> {
  const folder = await getFolderById(id);
  if (!folder) {
    return false;
  }

  // Системные папки нельзя переименовывать
  if (folder.isSystem) {
    throw new Error('Cannot rename system folder');
  }

  // Формирование нового пути
  const oldPath = folder.path;
  const pathParts = oldPath.split('/').filter(Boolean);
  pathParts[pathParts.length - 1] = newName;
  const newPath = '/' + pathParts.join('/');

  // Переименование физической папки
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const oldRelativePath = oldPath.startsWith('/') ? oldPath.substring(1) : oldPath;
    const newRelativePath = newPath.startsWith('/') ? newPath.substring(1) : newPath;
    
    const oldPhysicalPath = path.resolve(process.cwd(), 'storage/uploads', oldRelativePath);
    const newPhysicalPath = path.resolve(process.cwd(), 'storage/uploads', newRelativePath);
    
    // Проверяем существование старой папки
    try {
      await fs.access(oldPhysicalPath);
      // Переименовываем физическую папку
      await fs.rename(oldPhysicalPath, newPhysicalPath);
      console.log(`✓ Физическая папка переименована: ${oldPhysicalPath} → ${newPhysicalPath}`);
    } catch (error) {
      console.warn('Физическая папка не найдена или не может быть переименована:', error);
    }
  } catch (error) {
    console.error('Ошибка переименования физической папки:', error);
  }

  // Обновление в БД
  const result = await executeQuery<ResultSetHeader>(
    'UPDATE folders SET name = ?, path = ?, updated_at = ? WHERE id = ?',
    [newName, newPath, new Date(), id]
  );

  // Обновление путей всех вложенных папок
  await executeQuery(
    `UPDATE folders 
     SET path = CONCAT(?, SUBSTRING(path, ?)), updated_at = ?
     WHERE path LIKE ? AND id != ?`,
    [newPath, oldPath.length + 1, new Date(), `${oldPath}/%`, id]
  );

  return result.affectedRows > 0;
}

/**
 * Переместить папку
 */
export async function moveFolder(id: number, newParentId: number | null): Promise<boolean> {
  const folder = await getFolderById(id);
  if (!folder) {
    return false;
  }

  // Системные папки нельзя перемещать
  if (folder.isSystem) {
    throw new Error('Cannot move system folder');
  }

  // Получение нового родителя
  let newParentPath = '';
  if (newParentId) {
    const newParent = await getFolderById(newParentId);
    if (!newParent) {
      throw new Error('New parent folder not found');
    }

    // Нельзя переместить папку в свою подпапку
    if (newParent.path.startsWith(folder.path + '/')) {
      throw new Error('Cannot move folder into its own subfolder');
    }

    newParentPath = newParent.path;
  }

  // Формирование нового пути
  const oldPath = folder.path;
  const newPath = newParentPath ? `${newParentPath}/${folder.name}` : `/${folder.name}`;

  const result = await executeQuery<ResultSetHeader>(
    'UPDATE folders SET parent_id = ?, path = ?, updated_at = ? WHERE id = ?',
    [newParentId, newPath, new Date(), id]
  );

  // Обновление путей всех вложенных папок
  await executeQuery(
    `UPDATE folders 
     SET path = CONCAT(?, SUBSTRING(path, ?)), updated_at = ?
     WHERE path LIKE ? AND id != ?`,
    [newPath, oldPath.length + 1, new Date(), `${oldPath}/%`, id]
  );

  return result.affectedRows > 0;
}

/**
 * Удалить папку (soft delete)
 */
export async function deleteFolder(id: number): Promise<boolean> {
  const folder = await getFolderById(id);
  if (!folder) {
    return false;
  }

  // Системные папки нельзя удалять
  if (folder.isSystem) {
    throw new Error('Cannot delete system folder');
  }

  const now = new Date();

  // Soft delete папки и всех вложенных
  const result = await executeQuery<ResultSetHeader>(
    `UPDATE folders 
     SET deleted_at = ?, updated_at = ?
     WHERE (id = ? OR path LIKE ?) AND deleted_at IS NULL`,
    [now, now, id, `${folder.path}/%`]
  );

  return result.affectedRows > 0;
}

/**
 * Получить количество подпапок
 */
export async function getSubFoldersCount(folderId: number): Promise<number> {
  const rows = await executeQuery<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM folders WHERE parent_id = ? AND deleted_at IS NULL',
    [folderId]
  );

  return rows[0]?.count || 0;
}
