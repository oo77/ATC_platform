/**
 * Сравнение связанной группы ATC с её группой в Course Planner 2.
 */
import { createError } from "h3";
import type { StudyGroup } from "../repositories/groupRepository";
import type { GroupResource } from "./coursePlanner";
import {
  loadPlannerGroup,
  matchPlannerCourse,
  plannerDateToLocal,
  previewPlannerStudents,
  type PlannerCourseMatch,
  type PlannerStudentPreview,
} from "./plannerGroupSync";

export interface PlannerFieldChange {
  field: "startDate" | "endDate" | "classroom";
  label: string;
  current: string | null;
  planner: string | null;
}

export interface PlannerGroupDiff {
  plannerGroup: GroupResource["group"];
  plannerCourse: PlannerCourseMatch | null;
  courseMismatch: boolean;
  fieldChanges: PlannerFieldChange[];
  /** Слушатели планера, которых нет в группе ATC */
  studentsToAdd: PlannerStudentPreview[];
  /** Слушатели группы ATC, которых нет в группе планера */
  studentsNotInPlanner: Array<{ studentId: string; fullName: string; pinfl: string }>;
  /** Сырые данные планера (для применения изменений) */
  raw: GroupResource;
}

/**
 * Дата группы ATC → YYYY-MM-DD.
 * mysql2 возвращает DATE как Date на локальную полночь сервера, поэтому берём
 * локальные компоненты (как formatDateLocal в остальном коде групп).
 */
export function groupDateToLocal(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function buildPlannerGroupDiff(group: StudyGroup): Promise<PlannerGroupDiff> {
  if (!group.plannerGroupId) {
    throw createError({ statusCode: 400, message: "Группа не связана с Course Planner" });
  }

  const raw = await loadPlannerGroup(group.plannerGroupId);
  const pg = raw.group;

  const plannerCourse = await matchPlannerCourse(pg.course);
  const courseMismatch = !!plannerCourse && plannerCourse.id !== group.courseId;

  const fieldChanges: PlannerFieldChange[] = [];
  const plannerStart = plannerDateToLocal(pg.startDate);
  const plannerEnd = plannerDateToLocal(pg.endDate);
  const currentStart = groupDateToLocal(group.startDate);
  const currentEnd = groupDateToLocal(group.endDate);

  if (plannerStart && plannerStart !== currentStart) {
    fieldChanges.push({ field: "startDate", label: "Дата начала", current: currentStart, planner: plannerStart });
  }
  if (plannerEnd && plannerEnd !== currentEnd) {
    fieldChanges.push({ field: "endDate", label: "Дата окончания", current: currentEnd, planner: plannerEnd });
  }
  const plannerLocation = pg.location?.trim() || null;
  if (plannerLocation && plannerLocation !== (group.classroom || null)) {
    fieldChanges.push({
      field: "classroom",
      label: "Аудитория / место",
      current: group.classroom || null,
      planner: plannerLocation.slice(0, 100),
    });
  }

  const plannerStudents = await previewPlannerStudents(raw.students || []);
  const groupPinfls = new Set((group.students || []).map((s) => String(s.student?.pinfl || "")));
  const plannerPinfls = new Set(plannerStudents.map((s) => s.pinfl));

  const studentsToAdd = plannerStudents.filter(
    (s) => s.status !== "invalid" && !groupPinfls.has(s.pinfl),
  );
  const studentsNotInPlanner = (group.students || [])
    .filter((s) => s.student && !plannerPinfls.has(String(s.student.pinfl)))
    .map((s) => ({ studentId: s.studentId, fullName: s.student!.fullName, pinfl: s.student!.pinfl }));

  return { plannerGroup: pg, plannerCourse, courseMismatch, fieldChanges, studentsToAdd, studentsNotInPlanner, raw };
}
