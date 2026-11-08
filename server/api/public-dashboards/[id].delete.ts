/**
 * DELETE /api/public-dashboards/:id — удалить дашборд (ссылка перестаёт работать)
 */
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { deleteDashboard, getDashboardById } from "../../repositories/publicDashboardRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  const id = getRouterParam(event, "id") || "";
  if (!(await getDashboardById(id))) throw createError({ statusCode: 404, message: "Дашборд не найден" });
  await deleteDashboard(id);
  return { success: true };
});
