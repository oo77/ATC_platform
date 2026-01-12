/**
 * API endpoint для получения пути папки (цепочки предков)
 * GET /api/folders/[id]/path
 */

import { getFolderById } from '../../../repositories/folderRepository';
import { executeQuery } from '../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

interface FolderRow extends RowDataPacket {
  id: number;
  name: string;
  parent_id: number | null;
  path: string;
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    const id = getRouterParam(event, 'id');
    
    if (!id || id === 'root' || id === 'null') {
      return {
        success: true,
        path: [],
      };
    }

    const folderId = parseInt(id);
    if (isNaN(folderId)) {
      return {
        success: true,
        path: [],
      };
    }

    // Получаем папку
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: 'Папка не найдена',
      });
    }

    // Строим путь от корня до текущей папки
    const pathElements: Array<{ id: number; name: string }> = [];
    
    // Рекурсивно получаем всех предков
    let currentFolder = folder;
    const visited = new Set<number>();
    
    while (currentFolder) {
      // Защита от бесконечного цикла
      if (visited.has(currentFolder.id)) {
        break;
      }
      visited.add(currentFolder.id);
      
      pathElements.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
      });
      
      if (currentFolder.parentId === null) {
        break;
      }
      
      const parentFolder = await getFolderById(currentFolder.parentId);
      if (!parentFolder) {
        break;
      }
      currentFolder = parentFolder;
    }

    return {
      success: true,
      path: pathElements,
      currentFolder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
      },
    };
  } catch (error: any) {
    console.error('Ошибка получения пути папки:', error);

    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: 'Ошибка при получении пути папки',
      path: [],
    };
  }
});
