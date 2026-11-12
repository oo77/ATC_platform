/**
 * GET /api/schedule/bookings/options
 * Справочники для формы брони: аудитории, курсы, инструкторы, группы.
 */

import { executeQuery } from "../../../utils/db";
import { Permission, requirePermission } from "../../../utils/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.SCHEDULE_VIEW_ALL);

  const [classrooms, courses, instructors, groups] = await Promise.all([
    executeQuery<any[]>("SELECT id, name, capacity FROM classrooms WHERE is_active = 1 ORDER BY name"),
    executeQuery<any[]>(
      "SELECT id, name, code FROM courses WHERE is_archived = 0 ORDER BY name LIMIT 1000",
    ),
    executeQuery<any[]>(
      "SELECT id, full_name AS fullName FROM instructors WHERE is_active = 1 ORDER BY full_name LIMIT 1000",
    ),
    executeQuery<any[]>(
      `SELECT id, code, course_id AS courseId FROM study_groups
       WHERE is_archived = 0 AND end_date >= CURDATE() - INTERVAL 30 DAY
       ORDER BY code LIMIT 1000`,
    ),
  ]);

  return { success: true, classrooms, courses, instructors, groups };
});
