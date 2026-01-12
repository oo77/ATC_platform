/**
 * API endpoint для перемещения папки
 * PUT /api/folders/[id]/move
 */

import { moveFolder, getFolderById } from '../../../repositories/folderRepository';
import { logActivity } from '../../../utils/activityLogger';

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
    const folderId = id ? parseInt(id) : null;

    if (!folderId) {
      throw createError({
        statusCode: 400,
        message: 'ID папки не указан',
      });
    }

    const body = await readBody(event);
    const { newParentId } = body;

    // Проверка существования папки
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: 'Папка не найдена',
      });
    }

    // Системные папки нельзя перемещать
    if (folder.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Системные папки нельзя перемещать',
      });
    }

    // Перемещение
    const success = await moveFolder(folderId, newParentId || null);

    if (!success) {
      throw createError({
        statusCode: 500,
        message: 'Не удалось переместить папку',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'FOLDER',
      String(folderId),
      folder.name,
      { action: 'move', newParentId }
    );

    return {
      success: true,
      message: 'Папка успешно перемещена',
    };
  } catch (error: any) {
    console.error('Ошибка перемещения папки:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при перемещении папки',
    });
  }
});
