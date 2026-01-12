/**
 * DELETE /api/certificates/templates/[id]
 * Удалить шаблон сертификата
 */

import { 
  getTemplateById, 
  deleteTemplate 
} from '../../../repositories/certificateTemplateRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID шаблона обязателен',
      });
    }

    // Проверяем существование
    const existing = await getTemplateById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    // Удаляем
    const deleted = await deleteTemplate(id);

    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: 'Не удалось удалить шаблон',
      });
    }

    // Логируем действие
    await logActivity(
      event,
      'DELETE',
      'CERTIFICATE_TEMPLATE',
      id,
      existing.name
    );

    console.log(`[DELETE /api/certificates/templates/${id}] Удалён шаблон: ${existing.name}`);

    return {
      success: true,
      message: 'Шаблон успешно удалён',
    };
  } catch (error: any) {
    console.error('[DELETE /api/certificates/templates/[id]] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка удаления шаблона',
    });
  }
});
