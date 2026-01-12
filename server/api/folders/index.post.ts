/**
 * API endpoint для создания папки
 * POST /api/folders
 */

import { createFolder, getFolderByPath, getFolderById } from '../../repositories/folderRepository';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    const body = await readBody(event);

    // Валидация
    if (!body.name || !body.name.trim()) {
      return {
        success: false,
        message: 'Имя папки обязательно',
      };
    }

    const folderName = body.name.trim();
    const parentId = body.parentId || null;

    // Проверка на существование папки с таким же именем
    let expectedPath: string;
    if (parentId) {
      const parentFolder = await getFolderById(parentId);
      if (!parentFolder) {
        return {
          success: false,
          message: 'Родительская папка не найдена',
        };
      }
      expectedPath = `${parentFolder.path}/${folderName}`;
    } else {
      expectedPath = `/${folderName}`;
    }

    const existingFolder = await getFolderByPath(expectedPath);
    if (existingFolder) {
      // Возвращаем существующую папку вместо создания дубликата
      return {
        success: true,
        folder: existingFolder,
        message: 'Папка уже существует',
      };
    }

    // Создание папки
    const folder = await createFolder({
      name: folderName,
      parentId,
      userId: user.id,
    });

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'FOLDER',
      String(folder.id),
      folder.name,
      { path: folder.path }
    );

    return {
      success: true,
      folder,
    };
  } catch (error: any) {
    console.error('Ошибка создания папки:', error);

    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: error.message || 'Ошибка при создании папки',
    };
  }
});
