import { defineEventHandler, readBody, createError } from "h3";
import {
  createOrganization,
  organizationCodeExists,
  organizationInnExists,
} from "../../repositories/organizationRepository";
import { createActivityLog } from "../../repositories/activityLogRepository";

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
        statusMessage: "Название организации обязательно",
      });
    }

    // Проверка уникальности кода если указан
    if (body.code) {
      const codeExists = await organizationCodeExists(body.code.trim());
      if (codeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: "Организация с таким кодом уже существует",
        });
      }
    }

    // Проверка уникальности ИНН если указан
    if (body.inn && body.inn.trim()) {
      const innExists = await organizationInnExists(body.inn.trim());
      if (innExists) {
        throw createError({
          statusCode: 400,
          statusMessage: "Организация с таким ИНН уже существует",
        });
      }
    }

    const organization = await createOrganization({
      code: body.code?.trim(),
      inn: body.inn?.trim(),
      name: body.name.trim(),
      nameUz: body.nameUz?.trim(),
      nameEn: body.nameEn?.trim(),
      nameRu: body.nameRu?.trim(),
      contactPhone: body.contactPhone?.trim(),
      contactEmail: body.contactEmail?.trim(),
      contactPerson: body.contactPerson?.trim(),
      address: body.address?.trim(),
      legalAddress: body.legalAddress?.trim(),
      mfo: body.mfo?.trim(),
      accountNumber: body.accountNumber?.trim(),
      oked: body.oked?.trim(),
      description: body.description?.trim(),
      isActive: body.isActive !== false,
    });

    // Логирование действия
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "CREATE",
      entityType: "ORGANIZATION",
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
      message: "Организация успешно создана",
    };
  } catch (error: any) {
    console.error("Error creating organization:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при создании организации",
    });
  }
});
