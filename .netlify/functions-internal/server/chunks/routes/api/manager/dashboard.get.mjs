import { d as defineEventHandler, c as createError, e as executeQuery } from '../../../_/nitro.mjs';
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

const dashboard_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM study_groups WHERE end_date >= ?) as active_groups,
        (SELECT COUNT(DISTINCT sgs.student_id) 
         FROM study_group_students sgs 
         JOIN study_groups sg ON sgs.group_id = sg.id 
         WHERE sg.end_date >= ?) as students_on_courses,
        (SELECT COUNT(*) FROM test_assignments 
         WHERE DATE(start_date) = DATE(?) AND status = 'scheduled') as tests_today,
        (SELECT COUNT(*) FROM issued_certificates 
         WHERE status = 'pending') as certificates_pending
    `;
    const statsRows = await executeQuery(statsQuery, [now, now, now]);
    const stats = statsRows[0] || {
      active_groups: 0,
      students_on_courses: 0,
      tests_today: 0,
      certificates_pending: 0
    };
    const groupsQuery = `
      SELECT 
        sg.id,
        sg.code,
        sg.end_date,
        c.name as course_name,
        COUNT(DISTINCT sgs.student_id) as student_count,
        COALESCE(
          ROUND(
            (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id AND se.end_time < ?) 
            * 100.0 / NULLIF((SELECT COUNT(*) FROM schedule_events se2 WHERE se2.group_id = sg.id), 0)
          ), 0
        ) as progress
      FROM study_groups sg
      JOIN courses c ON sg.course_id = c.id
      LEFT JOIN study_group_students sgs ON sg.id = sgs.group_id
      WHERE sg.end_date >= ?
      GROUP BY sg.id, sg.code, sg.end_date, c.name
      ORDER BY sg.start_date DESC
      LIMIT 6
    `;
    const groups = await executeQuery(groupsQuery, [now, now]);
    const todayScheduleQuery = `
      SELECT 
        se.id,
        se.title,
        se.start_time,
        se.event_type,
        sg.code as group_code,
        i.full_name as instructor_name
      FROM schedule_events se
      JOIN study_groups sg ON se.group_id = sg.id
      LEFT JOIN instructors i ON se.instructor_id = i.id
      WHERE se.start_time >= ? AND se.start_time < ?
      ORDER BY se.start_time ASC
      LIMIT 10
    `;
    const todaySchedule = await executeQuery(todayScheduleQuery, [todayStart, todayEnd]);
    const groupsEndingSoonQuery = `
      SELECT 
        sg.id,
        sg.code,
        sg.end_date,
        COUNT(DISTINCT sgs.student_id) as student_count
      FROM study_groups sg
      LEFT JOIN study_group_students sgs ON sg.id = sgs.group_id
      WHERE sg.end_date >= ? AND sg.end_date < ?
      GROUP BY sg.id, sg.code, sg.end_date
      ORDER BY sg.end_date ASC
    `;
    const groupsEndingSoon = await executeQuery(groupsEndingSoonQuery, [now, weekEnd]);
    const alerts = [];
    const lowAttendanceQuery = `
      SELECT COUNT(DISTINCT a.student_id) as count
      FROM attendance a
      JOIN schedule_events se ON a.schedule_event_id = se.id
      JOIN study_groups sg ON se.group_id = sg.id
      WHERE sg.end_date >= ?
      GROUP BY a.student_id
      HAVING (SUM(CASE WHEN a.hours_attended > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) < 70
    `;
    const lowAttendanceRows = await executeQuery(lowAttendanceQuery, [now]);
    if (lowAttendanceRows.length > 0) {
      alerts.push(`${lowAttendanceRows.length} \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u0441 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C\u044E \u043D\u0438\u0436\u0435 70%`);
    }
    const overdueTestsQuery = `
      SELECT COUNT(*) as count
      FROM test_assignments ta
      LEFT JOIN test_sessions ts ON ta.id = ts.assignment_id
      WHERE ta.end_date < ? AND ta.status = 'scheduled'
        AND (ts.id IS NULL OR ts.status != 'completed')
    `;
    const overdueTestsRows = await executeQuery(overdueTestsQuery, [now]);
    if (overdueTestsRows[0]?.count > 0) {
      alerts.push(`${overdueTestsRows[0].count} \u043D\u0435\u043F\u0440\u043E\u0439\u0434\u0435\u043D\u043D\u044B\u0445 \u0442\u0435\u0441\u0442\u043E\u0432 \u0441 \u0438\u0441\u0442\u0435\u043A\u0448\u0438\u043C \u0441\u0440\u043E\u043A\u043E\u043C`);
    }
    const groupsWithoutInstructorQuery = `
      SELECT COUNT(DISTINCT sg.id) as count
      FROM study_groups sg
      WHERE sg.end_date >= ?
        AND NOT EXISTS (
          SELECT 1 FROM schedule_events se 
          WHERE se.group_id = sg.id AND se.instructor_id IS NOT NULL
        )
    `;
    const groupsWithoutInstructorRows = await executeQuery(groupsWithoutInstructorQuery, [now]);
    if (groupsWithoutInstructorRows[0]?.count > 0) {
      alerts.push(`${groupsWithoutInstructorRows[0].count} \u0433\u0440\u0443\u043F\u043F \u0431\u0435\u0437 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044F`);
    }
    const monthlyStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM study_groups 
         WHERE end_date >= ? AND end_date < ?) as groups_completed,
        (SELECT COUNT(*) FROM issued_certificates 
         WHERE DATE(issue_date) >= ? AND DATE(issue_date) < ?) as certificates_issued,
        (SELECT COUNT(DISTINCT sgs.student_id) 
         FROM study_group_students sgs 
         JOIN study_groups sg ON sgs.group_id = sg.id 
         WHERE sg.end_date >= ? AND sg.end_date < ?) as students_trained,
        (SELECT COALESCE(ROUND(AVG(
           (SELECT COUNT(*) FROM attendance a2 
            JOIN schedule_events se2 ON a2.schedule_event_id = se2.id 
            WHERE se2.group_id = sg2.id AND a2.hours_attended > 0) 
           * 100.0 / NULLIF((SELECT COUNT(*) FROM attendance a3 
            JOIN schedule_events se3 ON a3.schedule_event_id = se3.id 
            WHERE se3.group_id = sg2.id), 0)
         )), 0) FROM study_groups sg2 
         WHERE sg2.end_date >= ? AND sg2.end_date < ?) as average_attendance,
        (SELECT COALESCE(ROUND(AVG(g.grade)), 0) FROM grades g 
         JOIN schedule_events se ON g.schedule_event_id = se.id 
         JOIN study_groups sg ON se.group_id = sg.id 
         WHERE sg.end_date >= ? AND sg.end_date < ?) as average_grade
    `;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthlyStatsRows = await executeQuery(monthlyStatsQuery, [
      monthStart,
      monthEnd,
      monthStart,
      monthEnd,
      monthStart,
      monthEnd,
      monthStart,
      monthEnd,
      monthStart,
      monthEnd
    ]);
    const monthlyStats = monthlyStatsRows[0] || {
      groups_completed: 0,
      certificates_issued: 0,
      students_trained: 0,
      average_attendance: 0,
      average_grade: 0
    };
    const studentsByCourseQuery = `
            SELECT 
                c.name,
                COUNT(sgs.student_id) as count
            FROM study_group_students sgs
            JOIN study_groups sg ON sgs.group_id = sg.id
            JOIN courses c ON sg.course_id = c.id
            WHERE sg.end_date >= ?
            GROUP BY c.id, c.name
            ORDER BY count DESC
            LIMIT 10
        `;
    const studentsByCourse = await executeQuery(studentsByCourseQuery, [now]);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    oneYearAgo.setDate(1);
    const certificatesByMonthQuery = `
            SELECT 
                DATE_FORMAT(issue_date, '%Y-%m') as month,
                COUNT(*) as count
            FROM issued_certificates
            WHERE issue_date >= ?
            GROUP BY DATE_FORMAT(issue_date, '%Y-%m')
            ORDER BY month ASC
        `;
    const certificatesByMonth = await executeQuery(certificatesByMonthQuery, [oneYearAgo]);
    const topCoursesQuery = `
            SELECT 
                c.id, 
                c.name, 
                c.code,
                COUNT(DISTINCT sg.id) as groups_count,
                COUNT(DISTINCT sgs.student_id) as students_count
            FROM courses c
            LEFT JOIN study_groups sg ON c.id = sg.course_id
            LEFT JOIN study_group_students sgs ON sg.id = sgs.group_id
            GROUP BY c.id
            ORDER BY students_count DESC
            LIMIT 10
        `;
    const topCourses = await executeQuery(topCoursesQuery, []);
    return {
      isManager: true,
      activeGroups: stats.active_groups,
      studentsOnCourses: stats.students_on_courses,
      testsToday: stats.tests_today,
      certificatesPending: stats.certificates_pending,
      groups,
      todaySchedule,
      groupsEndingSoon,
      alerts,
      monthlyStats: {
        groupsCompleted: monthlyStats.groups_completed,
        certificatesIssued: monthlyStats.certificates_issued,
        studentsTrained: monthlyStats.students_trained,
        averageAttendance: monthlyStats.average_attendance,
        averageGrade: monthlyStats.average_grade
      },
      studentsByCourse,
      certificatesByMonth,
      topCourses
    };
  } catch (error) {
    console.error("Failed to get manager dashboard stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve dashboard data"
    });
  }
});

export { dashboard_get as default };
//# sourceMappingURL=dashboard.get.mjs.map
