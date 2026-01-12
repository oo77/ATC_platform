/**
 * API endpoint для получения папки по имени
 * GET /api/folders/by-name/:name
 */

import { getFolderByPath } from '../../../repositories/folderRepository';

export default defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, 'name');

    if (!name) {
      throw createError({
        statusCode: 400,
        message: 'Имя папки не указано',
      });
    }

    // Получаем папку по пути (для корневых папок путь = /ИмяПапки)
    const folder = await getFolderByPath(`/${name}`);

    if (!folder) {
      throw createError({
        statusCode: 404,
        message: `Папка "${name}" не найдена`,
      });
    }

    return {
      success: true,
      folder: {
        id: folder.id,
        uuid: folder.uuid,
        name: folder.name,
        parentId: folder.parentId,
        path: folder.path,
        isSystem: folder.isSystem,
      },
    };
  } catch (error: any) {
    console.error('Ошибка получения папки:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error?.message || 'Ошибка при получении папки',
    });
  }
});
