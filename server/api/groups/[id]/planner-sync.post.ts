/**
 * Применить изменения из Course Planner 2 к связанной группе
 * POST /api/groups/:id/planner-sync
 * body: { updateFields?: boolean, addStudents?: boolean, removeMissing?: boolean }
 */
import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { z } from "zod";
import {
  getGroupById,
  addStudentsToGroup,
  checkStudentConflicts,
  removeStudentFromGroup,
} from "../../../repositories/groupRepository";
import { executeQuery } from "../../../utils/db";
import { buildPlannerGroupDiff, groupDateToLocal } from "../../../utils/plannerGroupDiff";
import { ensurePlannerStudents } from "../../../utils/plannerGroupSync";
import { logActivity } from "../../../utils/activityLogger";
import { invalidateRelatedCache } from "../../../utils/botCache";
import { Permission, requirePermission, roleHasPermission } from "../../../utils/permissions";

const bodySchema = z.object({
  updateFields: z.boolean().optional().default(true),
  addStudents: z.boolean().optional().default(true),
  removeMissing: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.GROUPS_UPDATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы не указан" });

  const parsed = bodySchema.safeParse((await readBody(event).catch(() => ({}))) || {});
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "Некорректные параметры синхронизации" });
  }
  const opts = parsed.data;

  const group = await getGroupById(id);
  if (!group) throw createError({ statusCode: 404, message: "Группа не найдена" });
  if (group.isArchived) {
    throw createError({ statusCode: 400, message: "Архивную группу синхронизировать нельзя" });
  }

  const canManageStudents = roleHasPermission(ctx, Permission.GROUPS_MANAGE_STUDENTS);
  if ((opts.addStudents || opts.removeMissing) && !canManageStudents) {
    throw createError({ statusCode: 403, message: "Недостаточно прав для изменения состава группы" });
  }

  const diff = await buildPlannerGroupDiff(group);
  const result = {
    updatedFields: [] as string[],
    added: 0,
    created: 0,
    removed: 0,
    conflicts: [] as Array<{ studentId: string; studentName: string; conflictGroupCode: string }>,
    errors: [] as Array<{ pinfl: string; name: string; error: string }>,
  };

  let startDate = groupDateToLocal(group.startDate)!;
  let endDate = groupDateToLocal(group.endDate)!;

  // 1. Поля группы: даты и место проведения
  if (opts.updateFields && diff.fieldChanges.length > 0) {
    const columns = { startDate: "start_date", endDate: "end_date", classroom: "classroom" } as const;
    const sets: string[] = [];
    const params: Array<string | null> = [];
    for (const ch of diff.fieldChanges) {
      sets.push(`${columns[ch.field]} = ?`);
      params.push(ch.planner);
      result.updatedFields.push(ch.label);
      if (ch.field === "startDate" && ch.planner) startDate = ch.planner;
      if (ch.field === "endDate" && ch.planner) endDate = ch.planner;
    }
    if (endDate < startDate) {
      throw createError({
        statusCode: 400,
        message: "В Course Planner дата окончания раньше даты начала — исправьте группу в планере",
      });
    }
    await executeQuery(`UPDATE study_groups SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  }

  // 2. Добавление слушателей из планера (отсутствующие в ATC создаются)
  if (opts.addStudents && diff.studentsToAdd.length > 0) {
    const pinflsToAdd = new Set(diff.studentsToAdd.map((s) => s.pinfl));
    const plannerStudents = (diff.raw.students || []).filter((s) =>
      pinflsToAdd.has(String(s.pinfl || "").trim()),
    );
    const ensured = await ensurePlannerStudents(plannerStudents, {
      createMissing: roleHasPermission(ctx, Permission.STUDENTS_CREATE),
    });
    result.created = ensured.created;
    result.errors.push(...ensured.errors);

    let ids = Array.from(new Set(ensured.idsByPinfl.values()));
    if (ids.length > 0) {
      const conflicts = await checkStudentConflicts(ids, startDate, endDate, id, id);
      if (conflicts.length > 0) {
        result.conflicts = conflicts.map((c) => ({
          studentId: c.studentId,
          studentName: c.studentName,
          conflictGroupCode: c.conflictGroupCode,
        }));
        const conflicted = new Set(conflicts.map((c) => c.studentId));
        ids = ids.filter((sid) => !conflicted.has(sid));
      }
    }
    if (ids.length > 0) {
      const added = await addStudentsToGroup(id, ids);
      result.added = added.added.length;
    }
  }

  // 3. Удаление слушателей, которых нет в группе планера (только по явному запросу)
  if (opts.removeMissing && diff.studentsNotInPlanner.length > 0) {
    for (const s of diff.studentsNotInPlanner) {
      if (await removeStudentFromGroup(id, s.studentId)) result.removed++;
    }
  }

  await executeQuery(`UPDATE study_groups SET planner_synced_at = NOW(3) WHERE id = ?`, [id]);

  await logActivity(event, "UPDATE", "GROUP", id, group.code, {
    action: "planner_sync",
    plannerGroupId: group.plannerGroupId,
    updatedFields: result.updatedFields,
    added: result.added,
    created: result.created,
    removed: result.removed,
    conflicts: result.conflicts.length,
    errors: result.errors.length,
  });
  if (result.added > 0 || result.removed > 0) invalidateRelatedCache("student");

  return {
    success: true,
    result,
    group: await getGroupById(id),
  };
});
