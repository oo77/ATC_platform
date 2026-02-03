/**
 * GET /api/admin/ai-settings/errors
 * Получить логи ошибок AI API
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  console.log("[AI Settings API] GET errors");

  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 50;

    const errors = await aiSettingsRepository.getRecentErrors(limit);
    const errorsByType = await aiSettingsRepository.getErrorsByType();
    const errorCount24h = await aiSettingsRepository.getErrorCount24h();

    return {
      success: true,
      data: {
        errors,
        errorsByType,
        errorCount24h,
      },
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения логов ошибок AI",
    });
  }
});
