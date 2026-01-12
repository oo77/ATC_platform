/**
 * API endpoint для получения списка файлов
 * GET /api/files
 */

import { getFilesPaginated } from '../../repositories/fileRepository';
import { storage, type FileCategory } from '../../utils/storage';

export default defineEventHandler(async (event) => {
  try {
    // Получение текущего пользователя
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    // Получение query параметров
    const query = getQuery(event);
    
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const search = query.search as string | undefined;
    const category = query.category as FileCategory | undefined;
    const userId = query.userId ? parseInt(query.userId as string) : undefined;
    const courseId = query.courseId ? parseInt(query.courseId as string) : undefined;
    const groupId = query.groupId ? parseInt(query.groupId as string) : undefined;

    console.log('Files API - Получение списка файлов:', { page, limit, search, category });

    // Получение файлов с пагинацией
    const result = await getFilesPaginated({
      page,
      limit,
      search,
      category,
      userId,
      courseId,
      groupId,
    });

    // Добавление URL к каждому файлу
    const filesWithUrls = result.data.map((file) => ({
      id: file.id,
      uuid: file.uuid,
      filename: file.filename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      extension: file.extension,
      category: file.category,
      isPublic: file.isPublic,
      url: storage.getPublicUrl(file.uuid),
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
      metadata: file.metadata,
    }));

    console.log('Files API - Найдено файлов:', filesWithUrls.length);

    return {
      success: true,
      ...result,
      data: filesWithUrls,
    };
  } catch (error: any) {
    console.error('Ошибка получения списка файлов:', error);

    // Если это уже createError, пробрасываем его
    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: 'Ошибка при получении списка файлов',
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
  }
});
