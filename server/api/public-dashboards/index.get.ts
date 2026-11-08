/**
 * GET /api/public-dashboards — список публичных дашбордов
 */
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { listDashboards, toAdminDto } from "../../repositories/publicDashboardRepository";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  const items = await listDashboards();
  return { success: true, data: items.map(toAdminDto) };
});
