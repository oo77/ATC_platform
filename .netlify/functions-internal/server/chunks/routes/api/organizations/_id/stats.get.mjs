import { d as defineEventHandler, c as createError, C as getOrganizationById, e as executeQuery } from '../../../../_/nitro.mjs';
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

const stats_get = defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const organization = await getOrganizationById(id);
    if (!organization) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE organization_id = ?) as total_students,
        (SELECT COUNT(DISTINCT ic.student_id) 
         FROM issued_certificates ic
         JOIN students s ON ic.student_id = s.id
         WHERE s.organization_id = ? 
         AND ic.issue_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
         AND ic.status = 'issued') as trained_last_month,
        (SELECT COUNT(DISTINCT ic.student_id) 
         FROM issued_certificates ic
         JOIN students s ON ic.student_id = s.id
         WHERE s.organization_id = ? 
         AND ic.issue_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
         AND ic.status = 'issued') as trained_last_3_months,
        (SELECT COUNT(*) 
         FROM issued_certificates ic
         JOIN students s ON ic.student_id = s.id
         WHERE s.organization_id = ?) as total_certificates
    `;
    const statsResult = await executeQuery(statsQuery, [id, id, id, id]);
    const stats = statsResult[0] || {
      total_students: 0,
      trained_last_month: 0,
      trained_last_3_months: 0,
      total_certificates: 0
    };
    const coursesQuery = `
      SELECT 
        COALESCE(c.name, ic.course_name, '\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043A\u0443\u0440\u0441') as course_name,
        COALESCE(c.code, ic.course_code) as course_code,
        COUNT(*) as certificates_count,
        MAX(ic.issue_date) as last_issue_date
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups sg ON ic.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      WHERE s.organization_id = ?
        AND ic.status = 'issued'
      GROUP BY 
        COALESCE(c.id, ic.course_name),
        COALESCE(c.name, ic.course_name),
        COALESCE(c.code, ic.course_code)
      ORDER BY certificates_count DESC, last_issue_date DESC
      LIMIT 5
    `;
    const coursesResult = await executeQuery(coursesQuery, [id]);
    const popularCourses = coursesResult.map((row) => ({
      name: row.course_name,
      code: row.course_code,
      certificatesCount: row.certificates_count,
      lastIssueDate: row.last_issue_date
    }));
    const recentCertificatesQuery = `
      SELECT 
        ic.id,
        ic.certificate_number,
        s.full_name as student_name,
        COALESCE(c.name, ic.course_name, '\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043A\u0443\u0440\u0441') as course_name,
        ic.issue_date
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups sg ON ic.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      WHERE s.organization_id = ?
        AND ic.status = 'issued'
      ORDER BY ic.issue_date DESC
      LIMIT 5
    `;
    const recentCertificatesResult = await executeQuery(
      recentCertificatesQuery,
      [id]
    );
    const recentCertificates = recentCertificatesResult.map((row) => ({
      id: row.id,
      certificateNumber: row.certificate_number,
      studentName: row.student_name,
      courseName: row.course_name,
      issueDate: row.issue_date
    }));
    const monthlyStatsQuery = `
      SELECT 
        DATE_FORMAT(ic.issue_date, '%Y-%m') as month,
        COUNT(*) as certificates_count,
        COUNT(DISTINCT ic.student_id) as unique_students
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      WHERE s.organization_id = ?
        AND ic.status = 'issued'
        AND ic.issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(ic.issue_date, '%Y-%m')
      ORDER BY month DESC
    `;
    const monthlyResult = await executeQuery(monthlyStatsQuery, [id]);
    const monthlyStats = monthlyResult.map((row) => ({
      month: row.month,
      certificatesCount: row.certificates_count,
      uniqueStudents: row.unique_students
    }));
    return {
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          code: organization.code
        },
        stats: {
          totalStudents: stats.total_students,
          trainedLastMonth: stats.trained_last_month,
          trainedLast3Months: stats.trained_last_3_months,
          totalCertificates: stats.total_certificates
        },
        popularCourses,
        recentCertificates,
        monthlyStats
      }
    };
  } catch (error) {
    console.error("Error fetching organization stats:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
