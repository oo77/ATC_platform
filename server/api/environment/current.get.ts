import { requireSetupModeOrPermission, Permission } from "../../utils/permissions";
import { getAllSettingsGrouped } from "../../utils/systemSettings";

/**
 * Получение текущих значений настроек платформы из базы данных (с маскированием секретов)
 * GET /api/environment/current
 */
export default defineEventHandler(async (event) => {
  // До настройки системы — без входа; после — только с правом управления настройками
  await requireSetupModeOrPermission(event, Permission.SETTINGS_MANAGE);

  return await getAllSettingsGrouped(true);
});
