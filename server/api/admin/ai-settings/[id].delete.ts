/**
 * DELETE /api/admin/ai-settings/[id]
 * Удалить настройку AI
 */

import { aiSettingsRepository } from "../../../repositories/aiSettingsRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  // Только для администраторов
  await requirePermission(event, Permission.SETTINGS_MANAGE);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID настройки не указан",
    });
  }

  console.log(`[AI Settings API] DELETE settings: ${id}`);

  try {
    // Проверяем существование
    const existing = await aiSettingsRepository.getById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: "Настройка не найдена",
      });
    }

    // Проверяем, не удаляем ли единственную настройку
    const allSettings = await aiSettingsRepository.getAll();
    if (allSettings.length === 1) {
      throw createError({
        statusCode: 400,
        message:
          "Нельзя удалить единственную настройку AI. Сначала создайте новую.",
      });
    }

    // Удаляем
    await aiSettingsRepository.delete(id);

    console.log(`[AI Settings API] ✅ Deleted settings: ${id}`);

    return {
      success: true,
      message: "Настройка AI удалена",
    };
  } catch (error: any) {
    console.error("[AI Settings API] Error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка удаления настроек AI",
    });
  }
});
