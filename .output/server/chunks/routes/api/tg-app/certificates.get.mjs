import { g as defineEventHandler, i as getQuery, h as createError, f as executeQuery } from '../../../_/nitro.mjs';
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

const certificates_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { organizationId } = query;
    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const certificates = await executeQuery(
      `SELECT 
        cert.id,
        cert.certificate_number AS certificateNumber,
        cert.issue_date AS issueDate,
        CASE 
          WHEN cert.expiry_date < CURRENT_DATE THEN 'expired' 
          ELSE 'issued' 
        END as status,
        cert.pdf_file_url AS pdfFileUrl,
        s.id AS studentId,
        s.full_name AS studentName,
        c.name AS courseName,
        g.code AS groupCode
      FROM issued_certificates cert
      INNER JOIN students s ON cert.student_id = s.id
      LEFT JOIN study_groups g ON cert.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE s.organization_id = ?
      ORDER BY cert.issue_date DESC`,
      [organizationId]
    );
    const formattedCertificates = [];
    for (const cert of certificates) {
      const attendanceStats = await executeQuery(
        `SELECT 
          COUNT(a.id) AS totalEvents,
          SUM(CASE WHEN a.hours_attended > 0 THEN 1 ELSE 0 END) AS presentCount
        FROM attendance a
        INNER JOIN schedule_events se ON a.schedule_event_id = se.id
        WHERE a.student_id = ?`,
        [cert.studentId]
      );
      const totalEvents = Number(attendanceStats[0]?.totalEvents || 0);
      const presentCount = Number(attendanceStats[0]?.presentCount || 0);
      const attendancePercent = totalEvents > 0 ? presentCount / totalEvents * 100 : null;
      const hasPassed = attendancePercent !== null && attendancePercent >= 80;
      formattedCertificates.push({
        id: cert.id,
        studentName: cert.studentName,
        certificateNumber: cert.certificateNumber,
        courseName: cert.courseName,
        groupCode: cert.groupCode,
        issueDate: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("ru-RU") : "",
        status: cert.status,
        pdfFileUrl: cert.pdfFileUrl,
        hasPassed,
        attendancePercent
      });
    }
    return {
      success: true,
      certificates: formattedCertificates
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { certificates_get as default };
//# sourceMappingURL=certificates.get.mjs.map
