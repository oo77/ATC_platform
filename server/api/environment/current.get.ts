import { getAllSettingsGrouped } from "../../utils/systemSettings";

/**
 * Получение текущих значений настроек платформы из базы данных (с маскированием секретов)
 * GET /api/environment/current
 */
export default defineEventHandler(async () => {
  return await getAllSettingsGrouped(true);
});
