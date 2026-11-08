/**
 * GET /api/public-dashboards/:id — дашборд для редактора
 */
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { getDashboardById, toAdminDto } from "../../repositories/publicDashboardRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  const item = await getDashboardById(getRouterParam(event, "id") || "");
  if (!item) throw createError({ statusCode: 404, message: "Дашборд не найден" });
  return { success: true, data: toAdminDto(item) };
});
