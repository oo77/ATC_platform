/**
 * API endpoint для установки пароля на папку
 * POST /api/folders/[id]/set-password
 */

import bcrypt from 'bcryptjs';
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

    const body = await readBody(event);
    const { password } = body;

    if (!password || password.length < 6) {
      throw createError({
        statusCode: 400,
        message: 'Пароль должен содержать минимум 6 символов',
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

    // Системные папки нельзя защищать паролем
    if (folder.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Системные папки нельзя защищать паролем',
      });
    }

    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Сохранение хеша в БД
    await executeQuery<ResultSetHeader>(
      'UPDATE folders SET password_hash = ?, updated_at = ? WHERE id = ?',
      [passwordHash, new Date(), folderId]
    );

    return {
      success: true,
      message: 'Пароль успешно установлен',
    };
  } catch (error: any) {
    console.error('Ошибка установки пароля:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при установке пароля',
    });
  }
});
