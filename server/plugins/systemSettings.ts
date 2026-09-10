import { initSystemSettings } from "../utils/systemSettings";

/**
 * Серверный плагин для загрузки системных настроек из базы данных при запуске приложения.
 * Гарантирует, что все настройки платформы подгружаются из таблицы system_settings
 * и синхронизируются в process.env до обработки входящих HTTP-запросов.
 */
export default defineNitroPlugin(async () => {
  try {
    console.log("🚀 [SystemSettingsPlugin] Initializing database-backed settings...");
    await initSystemSettings();
  } catch (error: any) {
    console.warn("⚠️ [SystemSettingsPlugin] Could not initialize settings at startup:", error.message);
  }
});
