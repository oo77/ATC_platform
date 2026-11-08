/**
 * PUT /api/public-dashboards/:id — сохранить виджеты и настройки ссылки
 */
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { getDashboardById, toAdminDto, updateDashboard } from "../../repositories/publicDashboardRepository";
import { parseDashboardInput } from "../../utils/publicDashboardInput";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  const id = getRouterParam(event, "id") || "";
  if (!(await getDashboardById(id))) throw createError({ statusCode: 404, message: "Дашборд не найден" });

  const input = await parseDashboardInput(await readBody(event), false);
  await updateDashboard(id, input);
  const updated = await getDashboardById(id);
  return { success: true, data: updated ? toAdminDto(updated) : null };
});
