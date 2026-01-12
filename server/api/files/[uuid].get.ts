/**
 * API endpoint для получения файла
 * GET /api/files/[uuid]
 */

import { getFileByUuid } from '../../repositories/fileRepository';
import { storage } from '../../utils/storage';

export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid');
    
    if (!uuid) {
      throw createError({
        statusCode: 400,
        message: 'UUID файла не указан',
      });
    }

    // Получение метаданных файла из БД
    const fileRecord = await getFileByUuid(uuid);

    if (!fileRecord) {
      throw createError({
        statusCode: 404,
        message: 'Файл не найден',
      });
    }

    // TODO: Проверка прав доступа
    // Пока что разрешаем доступ только авторизованным пользователям
    const user = event.context.user;
    
    if (!fileRecord.isPublic && !user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    // Проверка уровня доступа
    if (!fileRecord.isPublic) {
      switch (fileRecord.accessLevel) {
        case 'owner':
          if (!user || (user.id !== fileRecord.uploadedBy && user.id !== fileRecord.userId)) {
            throw createError({
              statusCode: 403,
              message: 'Доступ запрещён',
            });
          }
          break;
        case 'admin':
          if (!user || user.role !== 'ADMIN') {
            throw createError({
              statusCode: 403,
              message: 'Доступ запрещён',
            });
          }
          break;
        case 'authenticated':
          // Проверка уже выполнена выше
          break;
        case 'public':
          // Публичный доступ
          break;
      }
    }

    // Получение файла из storage
    const fileData = await storage.get(fileRecord.fullPath);

    // Установка headers
    setHeader(event, 'Content-Type', fileRecord.mimeType);
    setHeader(event, 'Content-Length', fileRecord.sizeBytes.toString());
    setHeader(
      event,
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileRecord.filename)}"`
    );

    // Кэширование для публичных файлов
    if (fileRecord.isPublic) {
      setHeader(event, 'Cache-Control', 'public, max-age=31536000'); // 1 год
    }

    return fileData;
  } catch (error: any) {
    // Если это уже createError, пробрасываем его
    if (error.statusCode) {
      throw error;
    }

    console.error('Ошибка получения файла:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Ошибка при получении файла',
    });
  }
});
