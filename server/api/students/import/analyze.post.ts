/**
 * API endpoint для анализа файла импорта
 * POST /api/students/import/analyze
 */

import { defineEventHandler, readMultipartFormData } from 'h3';
import { parseExcelFile, analyzeImportData } from '../../../utils/importUtils';

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

    // Проверяем тип файла
    const filename = fileField.filename || '';
    if (!filename.match(/\.(xlsx|xls)$/i)) {
      return {
        success: false,
        error: 'Неверный формат файла. Поддерживаются только .xlsx и .xls',
      };
    }

    // Парсим Excel файл
    const rows = parseExcelFile(fileField.data);

    // Анализируем данные (теперь async - запрашивает БД)
    const analysis = await analyzeImportData(rows);

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error('Ошибка анализа файла импорта:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка анализа файла',
    };
  }
});
