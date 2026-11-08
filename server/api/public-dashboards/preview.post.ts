/**
 * POST /api/public-dashboards/preview — данные виджетов для живого предпросмотра в редакторе
 * (без сохранения). Тело: { widgets, settings }
 */
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import { normalizeSettings, normalizeWidgets } from "../../../shared/utils/publicDashboard";
import { resolveDashboardData } from "../../services/publicDashboardService";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.DASHBOARD_STATS);
  const body = await readBody(event);
  const settings = normalizeSettings(body?.settings);
  const widgets = normalizeWidgets(body?.widgets, settings.columns);
  return { success: true, data: await resolveDashboardData(widgets, settings), generatedAt: new Date().toISOString() };
});
