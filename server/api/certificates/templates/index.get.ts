/**
 * GET /api/certificates/templates
 * Получить список шаблонов сертификатов
 */

import { getTemplates } from '../../../repositories/certificateTemplateRepository';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const isActive = query.isActive !== undefined 
      ? query.isActive === 'true' 
      : undefined;

    const templates = await getTemplates({ isActive });

    console.log(`[GET /api/certificates/templates] Загружено ${templates.length} шаблонов`);

    return {
      success: true,
      templates,
      total: templates.length,
    };
  } catch (error: any) {
    console.error('[GET /api/certificates/templates] Error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка загрузки шаблонов',
    });
  }
});
