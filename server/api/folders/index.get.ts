/**
 * API endpoint для получения списка папок
 * GET /api/folders
 */

import { getSubFolders, getRootFolders } from '../../repositories/folderRepository';
import { requireFolderRead } from "../../utils/folderAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireFolderRead(event, Number(getQuery(event).parentId) || null);

  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    const query = getQuery(event);
    const parentId = query.parentId ? parseInt(query.parentId as string) : null;

    // Получение папок
    const folders = parentId === null 
      ? await getRootFolders()
      : await getSubFolders(parentId);

    return {
      success: true,
      folders: folders.map((f) => ({ ...f, passwordHash: f.passwordHash ? 'locked' : null })),
    };
  } catch (error: any) {
    console.error('Ошибка получения папок:', error);

    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: 'Ошибка при получении папок',
      folders: [],
    };
  }
});
