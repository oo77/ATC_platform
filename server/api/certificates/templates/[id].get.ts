/**
 * GET /api/certificates/templates/[id]
 * Получить шаблон сертификата по ID
 */

import { getTemplateById } from '../../../repositories/certificateTemplateRepository';
import { Permission, requirePermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.TEMPLATES_VIEW);

  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID шаблона обязателен',
      });
    }

    const template = await getTemplateById(id);

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    console.log(`[GET /api/certificates/templates/${id}] Загружен шаблон: ${template.name}`);

    return {
      success: true,
      template,
    };
  } catch (error: any) {
    console.error('[GET /api/certificates/templates/[id]] Error:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка загрузки шаблона',
    });
  }
});
