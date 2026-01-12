import { defineEventHandler, readBody, createError } from 'h3';
import { createOrganization, organizationCodeExists } from '../../repositories/organizationRepository';
import { createActivityLog } from '../../repositories/activityLogRepository';

/**
 * POST /api/organizations
 * Создание новой организации
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Валидация
    if (!body.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название организации обязательно',
      });
    }

    // Проверка уникальности кода если указан
    if (body.code) {
      const codeExists = await organizationCodeExists(body.code.trim());
      if (codeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Организация с таким кодом уже существует',
        });
      }
    }

    const organization = await createOrganization({
      code: body.code?.trim(),
      name: body.name.trim(),
      shortName: body.shortName?.trim(),
      contactPhone: body.contactPhone?.trim(),
      contactEmail: body.contactEmail?.trim(),
      address: body.address?.trim(),
      description: body.description?.trim(),
      isActive: body.isActive !== false,
    });

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || 'system',
      actionType: 'CREATE',
      entityType: 'ORGANIZATION',
      entityId: organization.id,
      entityName: organization.name,
      details: {
        name: organization.name,
        code: organization.code,
      },
    });

    return {
      success: true,
      data: organization,
      message: 'Организация успешно создана',
    };
  } catch (error: any) {
    console.error('Error creating organization:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при создании организации',
    });
  }
});
