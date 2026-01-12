import { defineEventHandler, createError } from 'h3';
import { getRepresentativeById } from '../../repositories/representativeRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * GET /api/representatives/:id
 * Получение детальной информации о представителе
 */
export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID представителя не указан',
      });
    }

    const representative = await getRepresentativeById(id);

    if (!representative) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Представитель не найден',
      });
    }

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'VIEW',
      entityType: 'REPRESENTATIVE',
      entityId: id,
      entityName: representative.fullName,
    });

    return {
      success: true,
      data: representative,
    };
  } catch (error: any) {
    console.error('Error fetching representative:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении представителя',
    });
  }
});
