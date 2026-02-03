/**
 * GET /api/admin/ai-settings
 * Получить все настройки AI
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  console.log("[AI Settings API] GET all settings");

  try {
    const settings = await aiSettingsRepository.getAll();

    // Не возвращаем зашифрованные ключи на фронтенд
    const safeSettings = settings.map((s) => ({
      ...s,
      apiKeyEncrypted: undefined, // Убираем зашифрованный ключ
      apiKeyMasked: s.apiKeyLastFour ? `****${s.apiKeyLastFour}` : "****",
    }));

    return {
      success: true,
      data: safeSettings,
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения настроек AI",
    });
  }
});
