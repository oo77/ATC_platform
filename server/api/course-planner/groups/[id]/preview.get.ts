/**
 * Предпросмотр группы Course Planner 2: сопоставленный курс, даты, место,
 * слушатели (есть в ATC / будут созданы).
 * GET /api/course-planner/groups/:id/preview
 */
import { defineEventHandler, getRouterParam, createError } from "h3";
import { buildPlannerGroupPreview } from "../../../../utils/plannerGroupSync";
import { Permission, requireAnyPermission } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
  // список нужен и при создании группы, и при привязке существующей
  await requireAnyPermission(event, [Permission.GROUPS_CREATE, Permission.GROUPS_UPDATE]);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы планера не указан" });

  const preview = await buildPlannerGroupPreview(id);
  return { success: true, preview };
});
