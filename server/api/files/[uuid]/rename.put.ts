/**
 * API endpoint для переименования файла
 * PUT /api/files/[uuid]/rename
 */

import { getFileByUuid, updateFile } from '../../../repositories/fileRepository';
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

    const uuid = getRouterParam(event, 'uuid');

    if (!uuid) {
      throw createError({
        statusCode: 400,
        message: 'UUID файла не указан',
      });
    }

    const body = await readBody(event);
    const { newName } = body;

    if (!newName || !newName.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Новое имя файла не указано',
      });
    }

    // Проверка существования файла
    const file = await getFileByUuid(uuid);
    if (!file) {
      throw createError({
        statusCode: 404,
        message: 'Файл не найден',
      });
    }

    // Обновление имени файла
    const success = await updateFile(file.id, {
      filename: newName.trim(),
    });

    if (!success) {
      throw createError({
        statusCode: 500,
        message: 'Не удалось переименовать файл',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'FILE',
      uuid,
      newName.trim(),
      { oldName: file.filename, newName: newName.trim() }
    );

    return {
      success: true,
      message: 'Файл успешно переименован',
    };
  } catch (error: any) {
    console.error('Ошибка переименования файла:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при переименовании файла',
    });
  }
});
