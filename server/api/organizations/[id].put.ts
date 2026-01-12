import { defineEventHandler, readBody, createError } from 'h3';
import { updateOrganization, getOrganizationById, organizationCodeExists } from '../../repositories/organizationRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * PUT /api/organizations/:id
 * Обновление организации
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

    const body = await readBody(event);

    // Валидация названия если указано
    if (body.name !== undefined && !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название организации не может быть пустым',
      });
    }

    // Проверка уникальности кода если изменяется
    if (body.code !== undefined && body.code.trim() !== existing.code) {
      const codeExists = await organizationCodeExists(body.code.trim(), id);
      if (codeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Организация с таким кодом уже существует',
        });
      }
    }

    const updated = await updateOrganization(id, {
      code: body.code,
      name: body.name,
      shortName: body.shortName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      address: body.address,
      description: body.description,
      isActive: body.isActive,
    });

    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось обновить организацию',
      });
    }

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'UPDATE',
      entityType: 'ORGANIZATION',
      entityId: id,
      entityName: updated.name,
      details: {
        name: updated.name,
        changes: Object.keys(body).filter(k => body[k] !== undefined),
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Организация успешно обновлена',
    };
  } catch (error: any) {
    console.error('Error updating organization:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при обновлении организации',
    });
  }
});
