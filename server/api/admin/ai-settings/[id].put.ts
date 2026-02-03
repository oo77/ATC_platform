/**
 * PUT /api/admin/ai-settings/[id]
 * Обновить настройку AI
 */

import {
  aiSettingsRepository,
  type UpdateAISettingsInput,
} from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
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
      const validProviders = ["openai", "openrouter", "anthropic", "custom"];
      if (!validProviders.includes(body.provider)) {
        throw createError({
          statusCode: 400,
          message: `Неверный провайдер. Допустимые значения: ${validProviders.join(", ")}`,
        });
      }
    }

    // Обновляем настройки
    const settings = await aiSettingsRepository.update(id, {
      ...body,
      updatedBy: user.id,
    });

    console.log(`[AI Settings API] ✅ Updated settings: ${id}`);

    return {
      success: true,
      data: {
        ...settings,
        apiKeyEncrypted: undefined,
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
