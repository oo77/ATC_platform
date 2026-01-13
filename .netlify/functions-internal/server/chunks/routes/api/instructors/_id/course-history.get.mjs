import { d as defineEventHandler, a as getRouterParam, c as createError, e as executeQuery } from '../../../../nitro/nitro.mjs';
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
import 'jsonwebtoken';

const courseHistory_get = defineEventHandler(async (event) => {
  try {
    const instructorId = getRouterParam(event, "id");
    if (!instructorId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const instructorCheck = await executeQuery(
      "SELECT id FROM instructors WHERE id = ?",
      [instructorId]
    );
    if (instructorCheck.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const sql = `
      SELECT 
        se.id as event_id,
        se.title as event_title,
        DATE(se.start_time) as event_date,
        se.start_time as event_start_time,
        se.end_time as event_end_time,
        se.event_type,
        TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 45 as academic_hours,
        sg.id as group_id,
        sg.code as group_code,
        c.name as course_name,
        d.name as discipline_name,
        COUNT(DISTINCT sgs.student_id) as total_students,
        COUNT(DISTINCT a.student_id) as students_marked,
        COUNT(DISTINCT g.student_id) as students_graded,
        COALESCE(AVG(a.hours_attended), 0) as avg_attendance_hours,
        AVG(g.grade) as avg_grade
      FROM schedule_events se
      LEFT JOIN study_groups sg ON se.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      LEFT JOIN disciplines d ON se.discipline_id = d.id
      LEFT JOIN study_group_students sgs ON sg.id = sgs.group_id
      LEFT JOIN attendance a ON se.id = a.schedule_event_id
      LEFT JOIN grades g ON se.id = g.schedule_event_id
      WHERE se.instructor_id = ?
        AND se.end_time < NOW()
      GROUP BY 
        se.id, se.title, se.start_time, se.end_time, se.event_type,
        sg.id, sg.code, c.name, d.name
      ORDER BY se.start_time DESC
      LIMIT 100
    `;
    const rows = await executeQuery(sql, [instructorId]);
    const history = rows.map((row) => {
      const totalStudents = Number(row.total_students);
      const studentsMarked = Number(row.students_marked);
      const studentsGraded = Number(row.students_graded);
      const completionPercent = row.event_type === "assessment" ? totalStudents > 0 ? Math.round(studentsGraded / totalStudents * 100) : 0 : totalStudents > 0 ? Math.round(studentsMarked / totalStudents * 100) : 0;
      return {
        id: row.event_id,
        title: row.event_title,
        date: row.event_date.toISOString().split("T")[0],
        startTime: row.event_start_time.toISOString(),
        endTime: row.event_end_time.toISOString(),
        eventType: row.event_type,
        academicHours: Math.round(Number(row.academic_hours) * 10) / 10,
        group: {
          id: row.group_id,
          code: row.group_code,
          courseName: row.course_name
        },
        discipline: {
          name: row.discipline_name
        },
        statistics: {
          totalStudents,
          studentsMarked,
          studentsGraded,
          avgAttendanceHours: Math.round(Number(row.avg_attendance_hours) * 10) / 10,
          avgGrade: row.avg_grade ? Math.round(Number(row.avg_grade) * 10) / 10 : null,
          completionPercent
        }
      };
    });
    return {
      success: true,
      history,
      summary: {
        totalEvents: history.length,
        totalHours: history.reduce((sum, e) => sum + e.academicHours, 0),
        theoryEvents: history.filter((e) => e.eventType === "theory").length,
        practiceEvents: history.filter((e) => e.eventType === "practice").length,
        assessmentEvents: history.filter((e) => e.eventType === "assessment").length
      }
    };
  } catch (error) {
    console.error("[Instructor Course History] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u043A\u0443\u0440\u0441\u043E\u0432"
    });
  }
});

export { courseHistory_get as default };
//# sourceMappingURL=course-history.get.mjs.map
