/**
 * API endpoint для удаления пароля с папки
 * DELETE /api/folders/[id]/remove-password
 */

import { getFolderById } from '../../../repositories/folderRepository';
import { executeQuery } from '../../../utils/db';
import type { ResultSetHeader } from 'mysql2/promise';

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

    // Проверка существования папки
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: 'Папка не найдена',
      });
    }

    if (!folder.passwordHash) {
      throw createError({
        statusCode: 400,
        message: 'Папка не защищена паролем',
      });
    }

    // Удаление пароля
    await executeQuery<ResultSetHeader>(
      'UPDATE folders SET password_hash = NULL, updated_at = ? WHERE id = ?',
      [new Date(), folderId]
    );

    return {
      success: true,
      message: 'Пароль успешно удален',
    };
  } catch (error: any) {
    console.error('Ошибка удаления пароля:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при удалении пароля',
    });
  }
});
