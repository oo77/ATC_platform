/**
 * PUT /api/admin/ai-settings/[id]
 * Обновить настройку AI
 */

import {
  aiSettingsRepository,
  type UpdateAISettingsInput,
} from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { invalidateAiClientCache } from "../../../utils/ai/chatEngine";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  const user = await requirePermission(event, Permission.SETTINGS_MANAGE);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID настройки не указан",
    });
  }

  console.log(`[AI Settings API] PUT update settings: ${id}`);

  try {
    // Проверяем существование
    const existing = await aiSettingsRepository.getById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: "Настройка не найдена",
      });
    }

    const body = await readBody<UpdateAISettingsInput>(event);

    // Валидация провайдера, если указан
    if (body.provider) {
      const cleanProvider = String(body.provider || "").trim().toLowerCase();
      if (!cleanProvider) {
        throw createError({
          statusCode: 400,
          message: "Провайдер не может быть пустым",
        });
      }
      body.provider = cleanProvider as any;
    }

    // Обновляем настройки
    const settings = await aiSettingsRepository.update(id, {
      ...body,
      updatedBy: user.userId,
    });
    invalidateAiClientCache();

    console.log(`[AI Settings API] ✅ Updated settings: ${id}`);

    const { apiKeyEncrypted, ...rest } = settings;
    return {
      success: true,
      data: {
        ...rest,
        apiKeyMasked: settings.apiKeyLastFour
          ? `****${settings.apiKeyLastFour}`
          : "****",
      },
      message: "Настройки AI обновлены",
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка обновления настроек AI",
    });
  }
});
