/**
 * API endpoint для выполнения импорта
 * POST /api/students/import/execute
 */

import { defineEventHandler, readMultipartFormData } from 'h3';
import {
  parseExcelFile,
  getValidImportData,
  createImportJob,
  executeImport,
} from '../../../utils/importUtils';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    // Читаем multipart form data
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      return {
        success: false,
        error: 'Файл не загружен',
      };
    }

    // Находим файл
    const fileField = formData.find(field => field.name === 'file');
    
    if (!fileField || !fileField.data) {
      return {
        success: false,
        error: 'Файл не найден в запросе',
      };
    }

    // Парсим Excel файл
    const rows = parseExcelFile(fileField.data);

    // Получаем все валидные данные для импорта
    const validData = getValidImportData(rows);

    if (validData.length === 0) {
      return {
        success: false,
        error: 'Нет валидных данных для импорта',
      };
    }

    // Создаём задачу импорта
    const jobId = createImportJob(validData.length);

    // Запускаем импорт асинхронно (не блокируем ответ)
    // Импорт работает напрямую с MySQL через репозиторий
    executeImport(validData, jobId).catch((error: Error) => {
      console.error('Ошибка выполнения импорта:', error);
    });

    // Логируем действие
    await logActivity(
      event,
      'IMPORT',
      'STUDENT',
      jobId,
      'Импорт студентов',
      { totalRows: validData.length }
    );

    return {
      success: true,
      jobId,
      totalRows: validData.length,
      message: 'Импорт запущен',
    };
  } catch (error) {
    console.error('Ошибка запуска импорта:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка запуска импорта',
    };
  }
});
