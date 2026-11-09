/**
 * Список групп Course Planner 2 для привязки к учебной группе ATC
 * GET /api/course-planner/groups?search=&status=&page=&limit=
 */
import { defineEventHandler, getQuery, createError } from "h3";
import type { RowDataPacket } from "mysql2/promise";
import { fetchCoursePlannerGroups, getCoursePlannerConfig } from "../../../utils/coursePlanner";
import { executeQuery } from "../../../utils/db";
import { plannerDateToLocal } from "../../../utils/plannerGroupSync";
import { Permission, requirePermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.GROUPS_CREATE);

  if (!getCoursePlannerConfig().enabled) {
    throw createError({ statusCode: 400, message: "Интеграция с Course Planner выключена в настройках" });
  }

  const q = getQuery(event);
  const res = await fetchCoursePlannerGroups({
    search: q.search ? String(q.search) : undefined,
    status: q.status ? String(q.status) : undefined,
    page: q.page ? Number(q.page) : 1,
    limit: Math.min(Number(q.limit) || 30, 100),
  });

  if (!res.success) {
    throw createError({ statusCode: 502, message: res.error || "Course Planner недоступен" });
  }

  const groups = res.data || [];
  const ids = groups.map((g) => g.id);
  const linked = new Map<string, { id: string; code: string }>();
  if (ids.length > 0) {
    const rows = await executeQuery<RowDataPacket[]>(
      `SELECT id, code, planner_group_id FROM study_groups
       WHERE planner_group_id IN (${ids.map(() => "?").join(", ")})`,
      ids,
    );
    for (const r of rows) linked.set(r.planner_group_id, { id: r.id, code: r.code });
  }

  return {
    success: true,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      status: g.status,
      startDate: plannerDateToLocal(g.startDate),
      endDate: plannerDateToLocal(g.endDate),
      location: g.location,
      studentCount: g.studentCount ?? g.currentStudents ?? 0,
      course: g.course ? { name: g.course.name, code: g.course.code } : null,
      linkedGroup: linked.get(g.id) || null,
    })),
    total: res.total || 0,
    page: res.page || 1,
    totalPages: res.totalPages || 1,
  };
});
