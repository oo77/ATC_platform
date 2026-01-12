/**
 * API endpoint для получения списка шаблонов сертификатов
 * GET /api/courses/templates
 */

import { getAllCertificateTemplates } from '../../repositories/courseRepository';

export default defineEventHandler(async (event) => {
  try {
    const templates = await getAllCertificateTemplates();

    return {
      success: true,
      templates,
    };
  } catch (error) {
    console.error('Ошибка получения шаблонов сертификатов:', error);
    
    return {
      success: false,
      message: 'Ошибка при получении шаблонов сертификатов',
      templates: [],
    };
  }
});
