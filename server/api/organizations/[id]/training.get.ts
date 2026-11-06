/**
 * GET /api/organizations/:id/training?year=2026
 * Аналитика обучения сотрудников организации: программы → группы → слушатели → сертификаты.
 */

import { loadOrganizationTraining } from "../../../services/organizationTrainingService";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ORGANIZATIONS_VIEW);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID организации обязателен" });
  }
  const year = Number(getQuery(event).year) || null;

  try {
    const data = await loadOrganizationTraining(id, year);
    if (!data) {
      throw createError({ statusCode: 404, message: "Организация не найдена" });
    }
    return { success: true, data };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Organization Training] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении аналитики обучения",
    });
  }
});
