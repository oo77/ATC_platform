/**
 * API endpoint для удаления файла
 * DELETE /api/files/[uuid]
 */

import { getFileByUuid, deleteFile } from '../../repositories/fileRepository';
import { storage } from '../../utils/storage';
import { logActivity } from '../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid');

    if (!uuid) {
      throw createError({
        statusCode: 400,
        message: 'UUID файла не указан',
      });
    }

    // Получение текущего пользователя
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    // Получение метаданных файла
    const fileRecord = await getFileByUuid(uuid);

    if (!fileRecord) {
      return {
        success: false,
        message: 'Файл не найден',
      };
    }

    // Проверка прав на удаление (только владелец или админ)
    const isOwner = user.id === fileRecord.uploadedBy || user.id === fileRecord.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав для удаления этого файла',
      });
    }

    // Удаление файла из БД (soft delete)
    const deleted = await deleteFile(uuid);

    if (!deleted) {
      return {
        success: false,
        message: 'Не удалось удалить файл из базы данных',
      };
    }

    // Удаление физического файла (опционально, можно отложить)
    // В production лучше делать это асинхронно через очередь задач
    try {
      await storage.delete(fileRecord.fullPath);
    } catch (error) {
      console.warn('Не удалось удалить физический файл:', error);
      // Не возвращаем ошибку, так как запись в БД уже удалена (soft delete)
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'FILE',
      uuid,
      fileRecord.filename,
      { mimeType: fileRecord.mimeType, sizeBytes: fileRecord.sizeBytes }
    );

    return {
      success: true,
      message: 'Файл успешно удалён',
    };
  } catch (error: any) {
    // Если это уже createError, пробрасываем его
    if (error.statusCode) {
      throw error;
    }

    console.error('Ошибка удаления файла:', error);

    return {
      success: false,
      message: 'Ошибка при удалении файла',
    };
  }
});
