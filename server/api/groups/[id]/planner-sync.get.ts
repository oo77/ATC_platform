/**
 * Предпросмотр синхронизации группы с Course Planner 2
 * GET /api/groups/:id/planner-sync
 */
import { defineEventHandler, getRouterParam, createError } from "h3";
import { getGroupById } from "../../../repositories/groupRepository";
import { buildPlannerGroupDiff } from "../../../utils/plannerGroupDiff";
import { Permission, requirePermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.GROUPS_UPDATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы не указан" });

  const group = await getGroupById(id);
  if (!group) throw createError({ statusCode: 404, message: "Группа не найдена" });

  const { raw: _raw, ...diff } = await buildPlannerGroupDiff(group);
  return {
    success: true,
    plannerSyncedAt: group.plannerSyncedAt || null,
    diff,
  };
});
