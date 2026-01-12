/**
 * API endpoint для проверки пароля папки
 * POST /api/folders/[id]/verify-password
 */

import bcrypt from 'bcryptjs';
import { getFolderById } from '../../../repositories/folderRepository';

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
    const { password } = body;

    if (!password) {
      throw createError({
        statusCode: 400,
        message: 'Пароль не указан',
      });
    }

    // Получение папки с паролем
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

    // Проверка пароля
    const isValid = await bcrypt.compare(password, folder.passwordHash);

    if (!isValid) {
      throw createError({
        statusCode: 403,
        message: 'Неверный пароль',
      });
    }

    return {
      success: true,
      message: 'Пароль верный',
      folderId,
    };
  } catch (error: any) {
    console.error('Ошибка проверки пароля:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при проверке пароля',
    });
  }
});
