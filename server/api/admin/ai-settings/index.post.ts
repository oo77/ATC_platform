/**
 * POST /api/admin/ai-settings
 * Создать новую настройку AI
 */

import {
  aiSettingsRepository,
  type CreateAISettingsInput,
} from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  const user = await requirePermission(event, Permission.SETTINGS_MANAGE);

  console.log("[AI Settings API] POST create new settings");

  try {
    const body = await readBody<CreateAISettingsInput>(event);

    // Валидация обязательных полей
    if (!body.provider) {
      throw createError({
        statusCode: 400,
        message: "Провайдер обязателен",
      });
    }

    if (!body.apiKey) {
      throw createError({
        statusCode: 400,
        message: "API ключ обязателен",
      });
    }

    // Валидация провайдера
    const validProviders = ["openai", "openrouter", "anthropic", "custom"];
    if (!validProviders.includes(body.provider)) {
      throw createError({
        statusCode: 400,
        message: `Неверный провайдер. Допустимые значения: ${validProviders.join(", ")}`,
      });
    }

    // Создаем настройки
    const settings = await aiSettingsRepository.create({
      ...body,
      createdBy: user.userId,
    });

    console.log(`[AI Settings API] ✅ Created settings: ${settings.id}`);

    const { apiKeyEncrypted, ...rest } = settings;
    return {
      success: true,
      data: {
        ...rest,
        apiKeyMasked: settings.apiKeyLastFour
          ? `****${settings.apiKeyLastFour}`
          : "****",
      },
      message: "Настройки AI созданы успешно",
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка создания настроек AI",
    });
  }
});
