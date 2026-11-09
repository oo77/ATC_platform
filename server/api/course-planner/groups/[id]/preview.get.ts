/**
 * Предпросмотр группы Course Planner 2: сопоставленный курс, даты, место,
 * слушатели (есть в ATC / будут созданы).
 * GET /api/course-planner/groups/:id/preview
 */
import { defineEventHandler, getRouterParam, createError } from "h3";
import { buildPlannerGroupPreview } from "../../../../utils/plannerGroupSync";
import { Permission, requirePermission } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.GROUPS_CREATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы планера не указан" });

  const preview = await buildPlannerGroupPreview(id);
  return { success: true, preview };
});
