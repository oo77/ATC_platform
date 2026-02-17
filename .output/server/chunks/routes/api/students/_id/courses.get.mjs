import { g as defineEventHandler, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const courses_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  const studentId = event.context.params?.id;
  console.log(
    `[API] GET /api/students/${studentId}/courses - Requested by user:`,
    user?.id
  );
  if (!user) {
    console.error("[API] Unauthorized access attempt to student courses");
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    console.error(
      `[API] Access denied for user ${user.id} with role ${user.role}`
    );
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden"
    });
  }
  if (!studentId) {
    console.error("[API] Student ID is required");
    throw createError({
      statusCode: 400,
      statusMessage: "Student ID is required"
    });
  }
  try {
    const studentData = await executeQuery(
      "SELECT id, full_name FROM students WHERE id = ? LIMIT 1",
      [studentId]
    );
    if (studentData.length === 0) {
      console.error(`[API] Student not found: ${studentId}`);
      throw createError({
        statusCode: 404,
        statusMessage: "Student not found"
      });
    }
    console.log(
      `[API] Fetching courses for student: ${studentData[0].full_name} (${studentId})`
    );
    const query = `
      SELECT 
        sg.id as group_id, 
        c.id as course_id, 
        c.name as course_name, 
        sg.code as group_name,
        CASE 
          WHEN sg.end_date < NOW() THEN 'completed' 
          ELSE 'active' 
        END as status,
        sg.start_date,
        sg.end_date,
        (SELECT i.full_name FROM schedule_events se 
          JOIN instructors i ON se.instructor_id = i.id 
          WHERE se.group_id = sg.id LIMIT 1) as teacher_name,
        (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id) as total_lessons,
        COALESCE((
          SELECT COUNT(*) 
          FROM attendance a
          JOIN schedule_events se ON a.schedule_event_id = se.id
          WHERE a.student_id = ? AND se.group_id = sg.id AND a.hours_attended > 0
        ), 0) as attended_lessons
      FROM students s
      JOIN study_group_students sgs ON s.id = sgs.student_id
      JOIN study_groups sg ON sgs.group_id = sg.id
      JOIN courses c ON sg.course_id = c.id
      WHERE s.id = ?
      ORDER BY sg.start_date DESC
    `;
    const rows = await executeQuery(query, [studentId, studentId]);
    const courses = rows.map((row) => {
      let progress = 0;
      if (row.total_lessons > 0) {
        progress = Math.round(row.attended_lessons / row.total_lessons * 100);
      }
      return {
        group_id: row.group_id,
        course_id: row.course_id,
        course_name: row.course_name,
        group_name: row.group_name,
        status: row.status,
        start_date: row.start_date,
        end_date: row.end_date,
        teacher_name: row.teacher_name || null,
        progress,
        total_lessons: row.total_lessons,
        attended_lessons: row.attended_lessons
      };
    });
    console.log(
      `[API] Successfully retrieved ${courses.length} courses for student ${studentId}`
    );
    return {
      success: true,
      courses
    };
  } catch (error) {
    console.error("[API] Failed to get student courses:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to retrieve courses"
    });
  }
});

export { courses_get as default };
//# sourceMappingURL=courses.get.mjs.map
