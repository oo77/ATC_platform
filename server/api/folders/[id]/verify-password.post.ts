/**
 * API endpoint для проверки пароля папки
 * POST /api/folders/[id]/verify-password
 */

import bcrypt from 'bcryptjs';
import { getFolderById } from '../../../repositories/folderRepository';
import { grantFolderUnlock } from "../../../utils/folderAccess";
import { requireAuthContext } from "../../../utils/permissions";
import { Permission, requirePermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.FILES_VIEW);

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

    // Пароль верный: ставим подписанную httpOnly-cookie разблокировки.
    // Без неё сервер не отдаст содержимое папки (проверка в utils/folderAccess.ts)
    grantFolderUnlock(event, await requireAuthContext(event), folder);

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
