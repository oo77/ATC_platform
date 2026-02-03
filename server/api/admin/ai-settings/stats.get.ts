/**
 * GET /api/admin/ai-settings/stats
 * Получить статистику использования AI
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  console.log("[AI Settings API] GET stats");

  try {
    const stats = await aiSettingsRepository.getStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения статистики AI",
    });
  }
});
