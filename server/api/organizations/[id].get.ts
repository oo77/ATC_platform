import { defineEventHandler, createError } from 'h3';
import { getOrganizationById } from '../../repositories/organizationRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * GET /api/organizations/:id
 * Получение детальной информации об организации
 */
export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID организации не указан',
      });
    }

    const organization = await getOrganizationById(id);

    if (!organization) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Организация не найдена',
      });
    }

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'VIEW',
      entityType: 'ORGANIZATION',
      entityId: id,
      entityName: organization.name,
      details: { name: organization.name },
    });

    return {
      success: true,
      data: organization,
    };
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении организации',
    });
  }
});
