/**
 * POST /api/public-dashboards/:id/regenerate-token — выпустить новую ссылку (старая перестаёт работать)
 */
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { getDashboardById, regenerateToken } from "../../../repositories/publicDashboardRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  const id = getRouterParam(event, "id") || "";
  if (!(await getDashboardById(id))) throw createError({ statusCode: 404, message: "Дашборд не найден" });
  const token = await regenerateToken(id);
  return { success: true, data: { token } };
});
