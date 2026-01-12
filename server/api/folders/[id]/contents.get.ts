/**
 * API endpoint для получения содержимого папки
 * GET /api/folders/[id]/contents
 */

import { getFolderById, getSubFolders } from '../../../repositories/folderRepository';
import { executeQuery } from '../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import { storage } from '../../../utils/storage';

interface FileRow extends RowDataPacket {
  id: number;
  uuid: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  extension: string;
  category: string;
  is_public: boolean;
  created_at: Date;
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    
    console.log('[API /folders/[id]/contents] User:', user?.id);
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    const id = getRouterParam(event, 'id');
    const folderId = id === 'root' ? null : (id ? parseInt(id) : null);

    console.log('[API /folders/[id]/contents] ID from route:', id, 'folderId:', folderId);

    // Проверка существования папки (если не корневая)
    if (folderId !== null) {
      const folder = await getFolderById(folderId);
      if (!folder) {
        throw createError({
          statusCode: 404,
          message: 'Папка не найдена',
        });
      }
    }

    // Получение подпапок
    console.log('[API /folders/[id]/contents] Получение подпапок для folderId:', folderId);
    const folders = await getSubFolders(folderId);

    // Получение файлов в папке
    const query = folderId === null
      ? 'SELECT id, uuid, filename, mime_type, size_bytes, extension, category, is_public, created_at FROM files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY filename ASC'
      : 'SELECT id, uuid, filename, mime_type, size_bytes, extension, category, is_public, created_at FROM files WHERE folder_id = ? AND deleted_at IS NULL ORDER BY filename ASC';

    const params = folderId === null ? [] : [folderId];
    const fileRows = await executeQuery<FileRow[]>(query, params);

    const files = fileRows.map((row) => ({
      id: row.id,
      uuid: row.uuid,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      extension: row.extension,
      category: row.category,
      isPublic: row.is_public,
      url: storage.getPublicUrl(row.uuid),
      createdAt: row.created_at,
    }));

    return {
      success: true,
      folders,
      files,
    };
  } catch (error: any) {
    console.error('Ошибка получения содержимого папки:', error);

    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: 'Ошибка при получении содержимого папки',
      folders: [],
      files: [],
    };
  }
});
