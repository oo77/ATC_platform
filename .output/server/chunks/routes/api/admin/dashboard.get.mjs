import { g as defineEventHandler, h as createError, f as executeQuery } from '../../../_/nitro.mjs';
import { g as getAcademicHourMinutes } from '../../../_/academicHours.mjs';
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
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const academicHourMinutes = await getAcademicHourMinutes();
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM students WHERE created_at >= ?) as students_last_week,
        (SELECT COUNT(*) FROM instructors) as total_instructors,
        (SELECT COUNT(*) FROM study_groups WHERE end_date >= ?) as active_groups,
        (SELECT COUNT(*) FROM issued_certificates 
         WHERE DATE(issue_date) >= ? AND DATE(issue_date) < ?) as certificates_this_month,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE(?)) as today_registrations
    `;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const statsRows = await executeQuery(statsQuery, [
      weekAgo,
      now,
      monthStart,
      monthEnd,
      now
    ]);
    const stats = statsRows[0] || {
      total_students: 0,
      students_last_week: 0,
      total_instructors: 0,
      active_groups: 0,
      certificates_this_month: 0,
      total_users: 0,
      today_registrations: 0
    };
    const studentsTrend = stats.total_students > 0 ? Math.round(stats.students_last_week / stats.total_students * 100) : 0;
    const activeSessionsQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(?, INTERVAL 1 HOUR)
    `;
    let activeSessions = 0;
    try {
      const sessionRows = await executeQuery(activeSessionsQuery, [now]);
      activeSessions = sessionRows[0]?.count || 0;
    } catch (e) {
    }
    const todayLogsQuery = `
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE DATE(created_at) = DATE(?)
    `;
    let todayLogs = 0;
    try {
      const logsRows = await executeQuery(todayLogsQuery, [now]);
      todayLogs = logsRows[0]?.count || 0;
    } catch (e) {
    }
    const systemAlerts = [];
    try {
      const pendingRepsQuery = `
        SELECT COUNT(*) as count
        FROM representatives
        WHERE status = 'pending'
      `;
      const repsRows = await executeQuery(pendingRepsQuery);
      if (repsRows[0]?.count > 0) {
        systemAlerts.push({
          type: "warning",
          message: `${repsRows[0].count} \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439 \u043E\u0436\u0438\u0434\u0430\u044E\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F`,
          action: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F\u043C"
        });
      }
    } catch (e) {
    }
    try {
      const openTicketsQuery = `
        SELECT COUNT(*) as count
        FROM support_tickets
        WHERE status IN ('new', 'in_progress')
      `;
      const ticketsRows = await executeQuery(openTicketsQuery);
      if (ticketsRows[0]?.count > 0) {
        systemAlerts.push({
          type: "warning",
          message: `${ticketsRows[0].count} \u0442\u0438\u043A\u0435\u0442\u043E\u0432 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F`,
          action: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443"
        });
      }
    } catch (e) {
    }
    const recentActivitiesQuery = `
      SELECT 
        al.id,
        al.action,
        al.created_at,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `;
    let recentActivities = [];
    try {
      recentActivities = await executeQuery(recentActivitiesQuery);
    } catch (e) {
    }
    const weeklyActivityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as logins
      FROM activity_logs
      WHERE created_at >= ?
        AND action LIKE '%\u0432\u0445\u043E\u0434%'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    let weeklyActivity = [];
    try {
      weeklyActivity = await executeQuery(weeklyActivityQuery, [
        weekAgo
      ]);
      const filledActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const existing = weeklyActivity.find((d) => {
          const dStr = new Date(d.date).toISOString().split("T")[0];
          return dStr === dateStr;
        });
        filledActivity.push({
          date: dateStr,
          logins: existing?.logins || 0
        });
      }
      weeklyActivity = filledActivity;
    } catch (e) {
      weeklyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        weeklyActivity.push({
          date: date.toISOString().split("T")[0],
          logins: 0
        });
      }
    }
    let studentsByOrganization = [];
    try {
      const orgQuery = `
                SELECT 
                    COALESCE(o.name, s.organization, '\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E') as name,
                    COUNT(s.id) as count
                FROM students s
                LEFT JOIN organizations o ON s.organization_id = o.id
                GROUP BY COALESCE(o.id, s.organization)
                ORDER BY count DESC
            `;
      const allOrgs = await executeQuery(orgQuery);
      if (allOrgs.length > 9) {
        const top9 = allOrgs.slice(0, 9);
        const others = allOrgs.slice(9);
        const otherCount = others.reduce(
          (sum, item) => sum + Number(item.count),
          0
        );
        studentsByOrganization = [
          ...top9,
          { name: "\u041E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435", count: otherCount }
        ];
      } else {
        studentsByOrganization = allOrgs;
      }
    } catch (e) {
      console.error("Failed to get students by organization:", e);
    }
    let certificatesByMonth = [];
    try {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const certMonthQuery = `
                SELECT 
                    DATE_FORMAT(issue_date, '%Y-%m') as month,
                    COUNT(*) as count
                FROM issued_certificates
                WHERE issue_date >= ?
                GROUP BY DATE_FORMAT(issue_date, '%Y-%m')
                ORDER BY month ASC
            `;
      const rawCertData = await executeQuery(certMonthQuery, [yearAgo]);
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        const existing = rawCertData.find((d) => d.month === monthStr);
        certificatesByMonth.push({
          month: monthStr,
          count: existing?.count || 0
        });
      }
    } catch (e) {
      console.error("Failed to get certificates by month:", e);
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        certificatesByMonth.push({
          month: date.toISOString().slice(0, 7),
          count: 0
        });
      }
    }
    let topInstructors = [];
    try {
      const instructorsQuery = `
                SELECT 
                    i.id,
                    i.full_name as name,
                    COALESCE(SUM(COALESCE(se.academic_hours, CEIL(COALESCE(se.duration_minutes, TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) / ?))), 0) as hours,
                    COUNT(se.id) as lessons_count
                FROM instructors i
                JOIN schedule_events se ON se.instructor_id = i.id 
                WHERE i.is_active = 1
                  AND se.start_time < NOW()
                  AND EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)
                GROUP BY i.id, i.full_name
                ORDER BY hours DESC
                LIMIT 10
            `;
      const rawInstructors = await executeQuery(instructorsQuery, [
        academicHourMinutes
      ]);
      topInstructors = rawInstructors.map((row) => ({
        id: row.id,
        name: row.name,
        hours: Math.round(row.hours * 10) / 10,
        lessonsCount: row.lessons_count
      }));
    } catch (e) {
      console.error("Failed to get top instructors:", e);
    }
    let topCoursesByGroups = [];
    try {
      const coursesByGroupsQuery = `
                SELECT 
                    c.id,
                    c.name,
                    c.code,
                    COUNT(sg.id) as groups_count
                FROM courses c
                LEFT JOIN study_groups sg ON sg.course_id = c.id
                WHERE c.is_active = 1
                GROUP BY c.id, c.name, c.code
                ORDER BY groups_count DESC
                LIMIT 10
            `;
      topCoursesByGroups = await executeQuery(coursesByGroupsQuery);
    } catch (e) {
      console.error("Failed to get top courses by groups:", e);
    }
    let topCoursesByStudents = [];
    try {
      const coursesByStudentsQuery = `
                SELECT 
                    c.id,
                    c.name,
                    c.code,
                    COUNT(DISTINCT sgs.student_id) as students_count
                FROM courses c
                LEFT JOIN study_groups sg ON sg.course_id = c.id
                LEFT JOIN study_group_students sgs ON sgs.group_id = sg.id
                WHERE c.is_active = 1
                GROUP BY c.id, c.name, c.code
                ORDER BY students_count DESC
                LIMIT 10
            `;
      topCoursesByStudents = await executeQuery(coursesByStudentsQuery);
    } catch (e) {
      console.error("Failed to get top courses by students:", e);
    }
    return {
      isAdmin: true,
      totalStudents: stats.total_students,
      studentsTrend,
      totalInstructors: stats.total_instructors,
      activeGroups: stats.active_groups,
      certificatesThisMonth: stats.certificates_this_month,
      totalUsers: stats.total_users,
      todayRegistrations: stats.today_registrations,
      activeSessions,
      todayLogs,
      systemAlerts,
      recentActivities,
      weeklyActivity,
      // Новые данные для чартов
      studentsByOrganization,
      certificatesByMonth,
      topInstructors,
      topCoursesByGroups,
      topCoursesByStudents
    };
  } catch (error) {
    console.error("Failed to get admin dashboard stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve dashboard data"
    });
  }
});

export { dashboard_get as default };
//# sourceMappingURL=dashboard.get.mjs.map
