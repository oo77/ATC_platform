/**
 * Связь учебных групп ATC с группами Course Planner 2
 * ===================================================
 * Направление данных: планер → ATC.
 *  - курс сопоставляется по коду (без учёта регистра), затем по названию;
 *  - даты и место проведения берутся из группы планера;
 *  - слушатели сопоставляются по ПИНФЛ, отсутствующие в ATC создаются
 *    из данных планера (ФИО, организация по ИНН, служба, должность, фото).
 */

import crypto from "crypto";
import { createError } from "h3";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery, getDbPool } from "./db";
import {
  fetchCoursePlannerGroup,
  type GroupResource,
  type StudentResource,
} from "./coursePlanner";

// ----------------------------------------------------------------------------
// Типы
// ----------------------------------------------------------------------------

export interface PlannerCourseMatch {
  id: string;
  name: string;
  code: string;
  matchedBy: "code" | "name";
}

export interface PlannerStudentPreview {
  pinfl: string;
  name: string;
  organization: string | null;
  /** existing — уже есть в ATC; new — будет создан; invalid — некорректный ПИНФЛ */
  status: "existing" | "new" | "invalid";
  studentId: string | null;
}

export interface PlannerGroupPreview {
  plannerGroup: GroupResource["group"];
  course: PlannerCourseMatch | null;
  startDate: string | null;
  endDate: string | null;
  classroom: string | null;
  students: PlannerStudentPreview[];
  /** ATC-группа, уже связанная с этой группой планера (если есть) */
  linkedGroup: { id: string; code: string } | null;
}

// ----------------------------------------------------------------------------
// Вспомогательные функции
// ----------------------------------------------------------------------------

const normalize = (s: string | null | undefined) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-zа-яёўқғҳ0-9]/gi, "");

/**
 * Часовой пояс, в котором планер хранит даты групп.
 * Планер отдаёт полночь по Ташкенту как ISO в UTC (10.11 00:00 → "2026-11-09T19:00:00.000Z"),
 * поэтому дату нужно брать в его поясе, а не в поясе сервера ATC.
 */
const PLANNER_TZ = process.env.COURSE_PLANNER_TZ || "Asia/Tashkent";

/** Дата из планера (ISO или YYYY-MM-DD) → YYYY-MM-DD в часовом поясе планера */
export function plannerDateToLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // en-CA форматирует как YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PLANNER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function pickLang(
  field: StudentResource["department"],
): { main: string | null; uz: string | null; ru: string | null; en: string | null } {
  if (field && typeof field === "object") {
    const uz = field.uz?.trim() || null;
    const ru = field.ru?.trim() || null;
    const en = field.en?.trim() || null;
    return { main: ru || uz || en, uz, ru, en };
  }
  if (typeof field === "string" && field.trim()) {
    const v = field.trim();
    return { main: v, uz: null, ru: v, en: null };
  }
  return { main: null, uz: null, ru: null, en: null };
}

/** Найти курс ATC, соответствующий курсу группы планера */
export async function matchPlannerCourse(
  course: GroupResource["group"]["course"],
): Promise<PlannerCourseMatch | null> {
  if (!course) return null;

  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT id, name, code FROM courses
     WHERE (is_archived = 0 OR is_archived IS NULL)`,
  );

  if (course.code) {
    const code = course.code.trim().toLowerCase();
    const byCode = rows.find((r) => String(r.code || "").trim().toLowerCase() === code);
    if (byCode) return { id: byCode.id, name: byCode.name, code: byCode.code, matchedBy: "code" };
  }

  if (course.name) {
    const name = normalize(course.name);
    const byName = rows.find((r) => normalize(r.name) === name);
    if (byName) return { id: byName.id, name: byName.name, code: byName.code, matchedBy: "name" };
  }

  return null;
}

/** Загрузить группу из планера или бросить понятную ошибку */
export async function loadPlannerGroup(plannerGroupId: string): Promise<GroupResource> {
  const res = await fetchCoursePlannerGroup({ id: plannerGroupId });
  if (!res.success || !res.data) {
    throw createError({
      statusCode: 502,
      message: res.error || "Не удалось получить группу из Course Planner",
    });
  }
  return res.data;
}

/** Сопоставить слушателей планера со слушателями ATC по ПИНФЛ (без изменений в БД) */
export async function previewPlannerStudents(
  students: StudentResource[],
): Promise<PlannerStudentPreview[]> {
  const pinfls = students
    .map((s) => String(s.pinfl || "").trim())
    .filter((p) => /^\d{14}$/.test(p));

  const existing = new Map<string, string>();
  if (pinfls.length > 0) {
    const rows = await executeQuery<RowDataPacket[]>(
      `SELECT id, pinfl FROM students WHERE pinfl IN (${pinfls.map(() => "?").join(", ")})`,
      pinfls,
    );
    for (const r of rows) existing.set(String(r.pinfl), r.id);
  }

  const seen = new Set<string>();
  const result: PlannerStudentPreview[] = [];
  for (const s of students) {
    const pinfl = String(s.pinfl || "").trim();
    if (seen.has(pinfl)) continue;
    seen.add(pinfl);
    const valid = /^\d{14}$/.test(pinfl);
    const studentId = valid ? existing.get(pinfl) || null : null;
    result.push({
      pinfl,
      name: String(s.name || "").trim(),
      organization: s.organization?.name || null,
      status: !valid ? "invalid" : studentId ? "existing" : "new",
      studentId,
    });
  }
  return result;
}

/**
 * Создать в ATC слушателей, которых ещё нет (по ПИНФЛ).
 * Существующих слушателей не изменяет.
 * Возвращает карту ПИНФЛ → id слушателя ATC для всех валидных слушателей.
 */
export async function ensurePlannerStudents(
  students: StudentResource[],
  options: { createMissing?: boolean } = {},
): Promise<{ idsByPinfl: Map<string, string>; created: number; errors: Array<{ pinfl: string; name: string; error: string }> }> {
  const createMissing = options.createMissing !== false;
  const preview = await previewPlannerStudents(students);
  const idsByPinfl = new Map<string, string>();
  const errors: Array<{ pinfl: string; name: string; error: string }> = [];
  let created = 0;

  for (const p of preview) {
    if (p.status === "existing" && p.studentId) idsByPinfl.set(p.pinfl, p.studentId);
    if (p.status === "invalid") {
      errors.push({ pinfl: p.pinfl || "пусто", name: p.name, error: "Некорректный ПИНФЛ (нужно 14 цифр)" });
    }
  }

  if (!createMissing) {
    for (const p of preview) {
      if (p.status === "new") {
        errors.push({ pinfl: p.pinfl, name: p.name, error: "Нет в базе ATC; нет прав на создание слушателей" });
      }
    }
    return { idsByPinfl, created, errors };
  }

  const toCreate = students.filter((s) => {
    const pinfl = String(s.pinfl || "").trim();
    return preview.some((p) => p.pinfl === pinfl && p.status === "new");
  });
  if (toCreate.length === 0) return { idsByPinfl, created, errors };

  const orgs = await executeQuery<RowDataPacket[]>(`SELECT id, name, inn FROM organizations`);
  const orgByInn = new Map<string, any>();
  const orgByName = new Map<string, any>();
  for (const o of orgs) {
    if (o.inn) orgByInn.set(String(o.inn).trim(), o);
    if (o.name) orgByName.set(normalize(o.name), o);
  }

  const pool = getDbPool();
  const createdPinfls = new Set<string>();

  for (const s of toCreate) {
    const pinfl = String(s.pinfl).trim();
    if (createdPinfls.has(pinfl)) continue;
    createdPinfls.add(pinfl);

    const tin = s.organization?.tin ? String(s.organization.tin).trim() : null;
    const plannerOrgName = s.organization?.name?.trim() || null;
    const org = (tin && orgByInn.get(tin)) || (plannerOrgName && orgByName.get(normalize(plannerOrgName))) || null;

    const dept = pickLang(s.department);
    const pos = pickLang(s.position);
    const photo = typeof s.photo === "string" && s.photo.trim() ? s.photo.trim() : null;
    const id = crypto.randomUUID();

    const params = [
      id,
      String(s.name || "").trim() || "Слушатель",
      pinfl,
      org?.name || plannerOrgName || "Не указана",
      org?.id || null,
      dept.main,
      dept.uz,
      dept.en,
      dept.ru,
      pos.main || "Слушатель",
      pos.uz,
      pos.en,
      pos.ru,
      photo,
    ];

    const sql = `
      INSERT INTO students
        (id, full_name, pinfl, organization, organization_id, department, department_uz, department_en, department_ru,
         position, position_uz, position_en, position_ru, photo_base64, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE updated_at = updated_at`;

    try {
      await pool.query(sql, params);
    } catch (err: any) {
      // Слишком большое фото — пробуем без него
      if (photo && /max_allowed_packet|too long/i.test(err?.message || "")) {
        try {
          params[13] = null;
          await pool.query(sql, params);
        } catch (e2: any) {
          errors.push({ pinfl, name: String(s.name || ""), error: e2?.message || "Ошибка создания" });
          continue;
        }
      } else {
        errors.push({ pinfl, name: String(s.name || ""), error: err?.message || "Ошибка создания" });
        continue;
      }
    }
    created++;
  }

  // Перечитываем id (на случай гонки, когда слушатель уже был создан параллельно)
  const pinfls = Array.from(createdPinfls);
  if (pinfls.length > 0) {
    const rows = await executeQuery<RowDataPacket[]>(
      `SELECT id, pinfl FROM students WHERE pinfl IN (${pinfls.map(() => "?").join(", ")})`,
      pinfls,
    );
    for (const r of rows) idsByPinfl.set(String(r.pinfl), r.id);
  }

  return { idsByPinfl, created, errors };
}

/** ATC-группа, связанная с группой планера */
export async function findGroupByPlannerId(
  plannerGroupId: string,
): Promise<{ id: string; code: string } | null> {
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT id, code FROM study_groups WHERE planner_group_id = ? LIMIT 1`,
    [plannerGroupId],
  );
  return rows[0] ? { id: rows[0].id, code: rows[0].code } : null;
}

/** Полный предпросмотр группы планера для формы создания группы в ATC */
export async function buildPlannerGroupPreview(plannerGroupId: string): Promise<PlannerGroupPreview> {
  const data = await loadPlannerGroup(plannerGroupId);
  const [course, students, linkedGroup] = await Promise.all([
    matchPlannerCourse(data.group.course),
    previewPlannerStudents(data.students || []),
    findGroupByPlannerId(data.group.id),
  ]);

  return {
    plannerGroup: data.group,
    course,
    startDate: plannerDateToLocal(data.group.startDate),
    endDate: plannerDateToLocal(data.group.endDate),
    classroom: data.group.location || null,
    students,
    linkedGroup,
  };
}
