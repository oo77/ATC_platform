/**
 * Привязать существующую группу ATC к группе Course Planner 2.
 * Данные группы и состав не меняются — их потом обновляет planner-sync.
 * PUT /api/groups/:id/planner-link
 * body: { plannerGroupId: string }
 */
import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { z } from "zod";
import { getGroupById } from "../../../repositories/groupRepository";
import { executeQuery } from "../../../utils/db";
import { findGroupByPlannerId, loadPlannerGroup } from "../../../utils/plannerGroupSync";
import { getCoursePlannerConfig } from "../../../utils/coursePlanner";
import { logActivity } from "../../../utils/activityLogger";
import { Permission, requirePermission } from "../../../utils/permissions";

const bodySchema = z.object({ plannerGroupId: z.string().trim().min(1).max(64) });

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.GROUPS_UPDATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы не указан" });

  const parsed = bodySchema.safeParse((await readBody(event).catch(() => ({}))) || {});
  if (!parsed.success) throw createError({ statusCode: 400, message: "Не указана группа Course Planner" });
  const { plannerGroupId } = parsed.data;

  if (!getCoursePlannerConfig().enabled) {
    throw createError({ statusCode: 400, message: "Интеграция с Course Planner выключена в настройках" });
  }

  const group = await getGroupById(id);
  if (!group) throw createError({ statusCode: 404, message: "Группа не найдена" });
  if (group.isArchived) throw createError({ statusCode: 400, message: "Архивную группу привязать нельзя" });

  const linked = await findGroupByPlannerId(plannerGroupId);
  if (linked && linked.id !== id) {
    throw createError({
      statusCode: 409,
      message: `Эта группа Course Planner уже связана с группой ${linked.code}`,
    });
  }

  // Проверяем, что группа в планере существует (иначе 502 с текстом ошибки)
  const planner = await loadPlannerGroup(plannerGroupId);

  await executeQuery(
    `UPDATE study_groups SET planner_group_id = ?, planner_synced_at = NULL WHERE id = ?`,
    [planner.group.id || plannerGroupId, id],
  );
  await logActivity(event, "UPDATE", "GROUP", id, group.code, {
    action: "planner_link",
    plannerGroupId: planner.group.id || plannerGroupId,
    plannerGroupName: planner.group.name,
    previousPlannerGroupId: group.plannerGroupId || null,
  });

  return { success: true, plannerGroup: { id: planner.group.id || plannerGroupId, name: planner.group.name } };
});
