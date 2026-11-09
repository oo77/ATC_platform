/**
 * Отвязать группу от Course Planner 2 (данные группы не меняются)
 * DELETE /api/groups/:id/planner-link
 */
import { defineEventHandler, getRouterParam, createError } from "h3";
import { getGroupById } from "../../../repositories/groupRepository";
import { executeQuery } from "../../../utils/db";
import { logActivity } from "../../../utils/activityLogger";
import { Permission, requirePermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.GROUPS_UPDATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы не указан" });

  const group = await getGroupById(id);
  if (!group) throw createError({ statusCode: 404, message: "Группа не найдена" });

  await executeQuery(
    `UPDATE study_groups SET planner_group_id = NULL, planner_synced_at = NULL WHERE id = ?`,
    [id],
  );
  await logActivity(event, "UPDATE", "GROUP", id, group.code, {
    action: "planner_unlink",
    plannerGroupId: group.plannerGroupId,
  });

  return { success: true };
});
