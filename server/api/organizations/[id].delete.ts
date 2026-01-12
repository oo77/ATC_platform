import { defineEventHandler, createError } from 'h3';
import { deleteOrganization, getOrganizationById } from '../../repositories/organizationRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * DELETE /api/organizations/:id
 * Удаление организации
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

    const existing = await getOrganizationById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Организация не найдена',
      });
    }

    try {
      await deleteOrganization(id);
    } catch (error: any) {
      if (error.message?.includes('связанные слушатели')) {
        throw createError({
          statusCode: 400,
          statusMessage: error.message,
        });
      }
      throw error;
    }

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'DELETE',
      entityType: 'ORGANIZATION',
      entityId: id,
      entityName: existing.name,
      details: {
        name: existing.name,
        code: existing.code,
      },
    });

    return {
      success: true,
      message: 'Организация успешно удалена',
    };
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при удалении организации',
    });
  }
});
