/**
 * API endpoint для загрузки файла
 * POST /api/files/upload
 */

import { storage, validateFile, type FileCategory } from '../../utils/storage';
import { createFile } from '../../repositories/fileRepository';
import { logActivity } from '../../utils/activityLogger';
import type { MultiPartData } from 'h3';

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

    // Чтение multipart/form-data
    const formData = await readMultipartFormData(event);
    
    if (!formData) {
      return {
        success: false,
        message: 'Файл не предоставлен',
      };
    }

    // Извлечение файла
    const fileData = formData.find((item) => item.name === 'file');
    if (!fileData || !fileData.data) {
      return {
        success: false,
        message: 'Файл не найден в запросе',
      };
    }

    // Извлечение категории
    const categoryData = formData.find((item) => item.name === 'category');
    const category = (categoryData?.data?.toString() || 'other') as FileCategory;

    // Извлечение folderId (опционально)
    const folderIdData = formData.find((item) => item.name === 'folderId');
    const folderId = folderIdData?.data?.toString() ? parseInt(folderIdData.data.toString()) : null;

    // Извлечение relatedId (опционально)
    const relatedIdData = formData.find((item) => item.name === 'relatedId');
    const relatedId = relatedIdData?.data?.toString();

    // Определение MIME типа
    const mimeType = fileData.type || 'application/octet-stream';
    const filename = fileData.filename || 'unnamed';

    // Валидация файла
    try {
      validateFile(
        { size: fileData.data.length, mimeType },
        50 * 1024 * 1024 // 50MB максимум
      );
    } catch (validationError) {
      return {
        success: false,
        message: validationError instanceof Error ? validationError.message : 'Ошибка валидации файла',
      };
    }

    // Получение пути папки из БД (если указан folderId)
    let folderPath: string | undefined;
    if (folderId) {
      const { getFolderById } = await import('../../repositories/folderRepository');
      const folder = await getFolderById(folderId);
      if (folder) {
        folderPath = folder.path;
      }
    }

    // Извлечение metadata из formData (для сертификатов)
    let metadata: Record<string, any> | undefined;
    const metadataField = formData.find((item) => item.name === 'metadata');
    if (metadataField?.data) {
      try {
        metadata = JSON.parse(metadataField.data.toString());
      } catch (error) {
        console.warn('Не удалось распарсить metadata:', error);
      }
    }

    // Сохранение файла через storage
    const savedFile = await storage.save(
      {
        filename,
        data: fileData.data,
        mimeType,
        size: fileData.data.length,
      },
      category,
      relatedId,
      folderPath,
      metadata
    );

    // Сохранение метаданных в БД
    const fileRecord = await createFile({
      uuid: savedFile.uuid,
      filename: savedFile.filename,
      storedName: savedFile.storedName,
      mimeType: savedFile.mimeType,
      sizeBytes: savedFile.sizeBytes,
      extension: savedFile.extension,
      storagePath: savedFile.storagePath,
      fullPath: savedFile.fullPath,
      category,
      folderId,
      metadata: savedFile.metadata,
      uploadedBy: user.id,
    });

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'FILE',
      fileRecord.uuid,
      fileRecord.filename,
      { category, mimeType: fileRecord.mimeType, sizeBytes: fileRecord.sizeBytes }
    );

    return {
      success: true,
      file: {
        id: fileRecord.id,
        uuid: fileRecord.uuid,
        filename: fileRecord.filename,
        mimeType: fileRecord.mimeType,
        sizeBytes: fileRecord.sizeBytes,
        extension: fileRecord.extension,
        category: fileRecord.category,
        url: storage.getPublicUrl(fileRecord.uuid),
        createdAt: fileRecord.createdAt,
      },
    };
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);

    return {
      success: false,
      message: 'Ошибка при загрузке файла',
    };
  }
});
