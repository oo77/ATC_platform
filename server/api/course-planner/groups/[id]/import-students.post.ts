/**
 * Подготовить слушателей группы Course Planner 2 к зачислению в ATC:
 * отсутствующие (по ПИНФЛ) создаются из данных планера.
 * POST /api/course-planner/groups/:id/import-students
 * Ответ: studentIds — id слушателей ATC в порядке списка планера.
 */
import { defineEventHandler, getRouterParam, createError } from "h3";
import { ensurePlannerStudents, loadPlannerGroup } from "../../../../utils/plannerGroupSync";
import { Permission, requirePermission, roleHasPermission } from "../../../../utils/permissions";
import { logActivity } from "../../../../utils/activityLogger";

export default defineEventHandler(async (event) => {
  const ctx = await requirePermission(event, Permission.GROUPS_CREATE);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "ID группы планера не указан" });

  const data = await loadPlannerGroup(id);
  const result = await ensurePlannerStudents(data.students || [], {
    createMissing: roleHasPermission(ctx, Permission.STUDENTS_CREATE),
  });

  const studentIds = Array.from(new Set(
    (data.students || [])
      .map((s) => result.idsByPinfl.get(String(s.pinfl || "").trim()))
      .filter((v): v is string => !!v),
  ));

  if (result.created > 0) {
    await logActivity(event, "IMPORT", "STUDENT", undefined, `Course Planner: ${data.group.name}`, {
      source: "course-planner",
      plannerGroupId: id,
      created: result.created,
    });
  }

  return {
    success: true,
    studentIds,
    created: result.created,
    errors: result.errors,
  };
});
