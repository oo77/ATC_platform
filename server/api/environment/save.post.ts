import { defineEventHandler, readBody, createError } from "h3";
import { saveSettings } from "../../utils/systemSettings";

/**
 * Сохранение настроек платформы в базу данных MySQL (таблица system_settings)
 * POST /api/environment/save
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  console.log("[SETTINGS] Saving platform settings to database...");

  try {
    if (!body || typeof body !== "object") {
      throw createError({
        statusCode: 400,
        message: "Некорректные данные для сохранения",
      });
    }

    const { updatedCount } = await saveSettings(body);

    console.log(`[SETTINGS] Saved ${updatedCount} settings to database`);

    return {
      success: true,
      message: "Настройки успешно сохранены в базе данных",
      updatedCount,
    };
  } catch (error: any) {
    console.error("[SETTINGS] Failed to save settings to database:", error);

    throw createError({
      statusCode: error.statusCode || 500,
      message: `Ошибка сохранения настроек: ${error.message}`,
    });
  }
});
