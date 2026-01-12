/**
 * API endpoint для переименования папки
 * PUT /api/folders/[id]/rename
 */

import { renameFolder, getFolderById } from '../../../repositories/folderRepository';
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
    const { newName } = body;

    if (!newName || !newName.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Новое имя папки не указано',
      });
    }

    // Проверка существования папки
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: 'Папка не найдена',
      });
    }

    // Системные папки нельзя переименовывать
    if (folder.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Системные папки нельзя переименовывать',
      });
    }

    // Переименование
    const success = await renameFolder(folderId, newName.trim());

    if (!success) {
      throw createError({
        statusCode: 500,
        message: 'Не удалось переименовать папку',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'FOLDER',
      String(folderId),
      newName.trim(),
      { oldName: folder.name, newName: newName.trim() }
    );

    return {
      success: true,
      message: 'Папка успешно переименована',
    };
  } catch (error: any) {
    console.error('Ошибка переименования папки:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при переименовании папки',
    });
  }
});
