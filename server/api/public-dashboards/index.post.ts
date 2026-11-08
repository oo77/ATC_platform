/**
 * POST /api/public-dashboards — создать публичный дашборд
 */
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { createDashboard, getDashboardById, toAdminDto } from "../../repositories/publicDashboardRepository";
import { parseDashboardInput } from "../../utils/publicDashboardInput";

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.DASHBOARD_STATS);
  const input = await parseDashboardInput(await readBody(event), true);
  const id = await createDashboard(input, ctx.userId);
  const created = await getDashboardById(id);
  return { success: true, data: created ? toAdminDto(created) : null };
});
