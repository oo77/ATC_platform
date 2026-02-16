/**
 * POST /api/certificates/templates/[id]/duplicate
 * Дублировать шаблон сертификата
 */

import {
  getTemplateById,
  createTemplate,
  updateTemplate,
} from "../../../../repositories/certificateTemplateRepository";
import { logActivity } from "../../../../utils/activityLogger";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID шаблона обязателен",
      });
    }

    // Получаем оригинальный шаблон
    const original = await getTemplateById(id);
    if (!original) {
      throw createError({
        statusCode: 404,
        message: "Шаблон не найден",
      });
    }

    // Создаём новый шаблон с копией данных
    const duplicatedTemplate = await createTemplate({
      name: `${original.name} (копия)`,
      description: original.description
        ? `${original.description} (копия)`
        : undefined,
      numberFormat: original.numberFormat,
    });

    // Копируем дополнительные данные (templateData, layout, backgroundUrl, variables, qrSettings)
    const updatedTemplate = await updateTemplate(duplicatedTemplate.id, {
      templateData: original.templateData ?? undefined,
      layout: original.layout ?? undefined,
      backgroundUrl: original.backgroundUrl ?? undefined,
      variables: original.variables ?? undefined,
      qrSettings: original.qrSettings ?? undefined,
      isActive: false, // Новый шаблон по умолчанию неактивен
    });

    // Логируем действие
    await logActivity(
      event,
      "CREATE",
      "CERTIFICATE_TEMPLATE",
      duplicatedTemplate.id,
      duplicatedTemplate.name,
      {
        action: "duplicate",
        originalTemplateId: id,
        originalTemplateName: original.name,
      },
    );

    console.log(
      `[POST /api/certificates/templates/${id}/duplicate] Создана копия шаблона: ${duplicatedTemplate.name} (ID: ${duplicatedTemplate.id})`,
    );

    return {
      success: true,
      template: updatedTemplate || duplicatedTemplate,
      message: "Шаблон успешно дублирован",
    };
  } catch (error: any) {
    console.error(
      "[POST /api/certificates/templates/[id]/duplicate] Error:",
      error,
    );

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка дублирования шаблона",
    });
  }
});
