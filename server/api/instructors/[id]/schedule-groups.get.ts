/**
 * GET /api/instructors/:id/schedule-groups
 * Группы, в которых инструктор ведёт занятия, — для скачивания расписания по группе.
 */

import type { RowDataPacket } from "mysql2/promise";
import { executeQuery } from "../../../utils/db";
import { Permission } from "../../../utils/permissions";
import { requireInstructorSelfOrPermission } from "../../../utils/resourceAccess";

interface GroupRow extends RowDataPacket {
  group_id: string;
  group_code: string;
  course_name: string;
  is_archived: number;
  events_count: number;
  days_count: number;
  first_day: Date | string;
  last_day: Date | string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const toYmd = (value: Date | string) => {
  if (typeof value === "string") return value.slice(0, 10);
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
};

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireInstructorSelfOrPermission(event, getRouterParam(event, "id"), Permission.INSTRUCTORS_VIEW);

  try {
    const instructorId = getRouterParam(event, "id");
    if (!instructorId) {
      throw createError({
        statusCode: 400,
        message: "ID инструктора обязателен",
      });
    }

    const rows = await executeQuery<GroupRow[]>(
      `SELECT sg.id AS group_id,
              sg.code AS group_code,
              c.name AS course_name,
              sg.is_archived,
              COUNT(se.id) AS events_count,
              COUNT(DISTINCT DATE(se.start_time)) AS days_count,
              MIN(DATE(se.start_time)) AS first_day,
              MAX(DATE(se.start_time)) AS last_day
         FROM schedule_events se
         JOIN study_groups sg ON sg.id = se.group_id
         JOIN courses c ON c.id = sg.course_id
        WHERE se.instructor_id = ?
        GROUP BY sg.id, sg.code, c.name, sg.is_archived
        ORDER BY last_day DESC, sg.code ASC`,
      [instructorId],
    );

    return {
      success: true,
      groups: rows.map((r) => ({
        id: r.group_id,
        code: r.group_code,
        courseName: r.course_name,
        isArchived: Boolean(r.is_archived),
        eventsCount: Number(r.events_count),
        daysCount: Number(r.days_count),
        firstDay: toYmd(r.first_day),
        lastDay: toYmd(r.last_day),
      })),
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[Instructor Schedule Groups] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при загрузке групп инструктора",
    });
  }
});
