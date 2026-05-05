/**
 * API endpoint для получения списка файлов по UUID (batch)
 * GET /api/files/batch?uuids=uuid1,uuid2
 */

import { getFilesByUuids } from '../../repositories/fileRepository';
import { storage } from '../../utils/storage';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const uuidsStr = query.uuids as string;

    if (!uuidsStr) {
      return {
        success: true,
        data: []
      };
    }

    const uuids = uuidsStr.split(',').filter(u => u.trim() !== '');
    if (uuids.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const files = await getFilesByUuids(uuids);

    // Добавление URL к каждому файлу
    const filesWithUrls = files.map((file) => ({
      ...file,
      url: storage.getPublicUrl(file.uuid)
    }));

    return {
      success: true,
      data: filesWithUrls
    };
  } catch (error: any) {
    console.error('Ошибка batch получения файлов:', error);
    return {
      success: false,
      message: 'Ошибка при получении файлов'
    };
  }
});
