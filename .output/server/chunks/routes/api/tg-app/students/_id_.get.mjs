import { g as defineEventHandler, j as getRouterParam, i as getQuery, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const studentId = getRouterParam(event, "id");
  const query = getQuery(event);
  const { organizationId } = query;
  console.log(
    `[TG-App] GET /api/tg-app/students/${studentId} - \u0414\u0435\u0442\u0430\u043B\u0438 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F`
  );
  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: "ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  try {
    const studentRows = await executeQuery(
      `SELECT 
        s.id,
        s.full_name as fullName,
        s.pinfl,
        s.position,
        s.department,
        s.organization_id as organizationId,
        COALESCE(o.name, s.organization) as organizationName,
        s.created_at as createdAt
      FROM students s
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE s.id = ? AND s.organization_id = ?
      LIMIT 1`,
      [studentId, organizationId]
    );
    if (studentRows.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
      });
    }
    const student = studentRows[0];
    const certificates = await executeQuery(
      `SELECT 
        ic.id,
        ic.certificate_number as certificateNumber,
        COALESCE(c.name, ic.course_name) as courseName,
        COALESCE(c.code, ic.course_code) as courseCode,
        COALESCE(ic.course_hours, c.total_hours) as courseHours,
        COALESCE(sg.code, ic.group_code) as groupCode,
        ic.issue_date as issueDate,
        ic.expiry_date as expiryDate,
        ic.status,
        ic.pdf_file_url as pdfFileUrl,
        ic.original_file_url as originalFileUrl,
        ic.source_type as sourceType,
        ic.import_source as importSource
      FROM issued_certificates ic
      LEFT JOIN study_groups sg ON ic.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      WHERE ic.student_id = ?
      ORDER BY ic.issue_date DESC`,
      [studentId]
    );
    console.log(`[TG-App] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432: ${certificates.length}`);
    const formattedCertificates = certificates.map((cert) => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      courseName: cert.courseName || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
      courseCode: cert.courseCode,
      courseHours: cert.courseHours,
      groupCode: cert.groupCode,
      issueDate: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("ru-RU") : null,
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("ru-RU") : null,
      status: cert.status,
      isExpired: cert.expiryDate ? new Date(cert.expiryDate) < /* @__PURE__ */ new Date() : false,
      hasPdf: !!(cert.pdfFileUrl || cert.originalFileUrl),
      pdfFileUrl: cert.pdfFileUrl || cert.originalFileUrl,
      // Fallback на оригинальный файл
      sourceType: cert.sourceType,
      importSource: cert.importSource
    }));
    const stats = {
      total: certificates.length,
      issued: certificates.filter((c) => c.status === "issued").length,
      revoked: certificates.filter((c) => c.status === "revoked").length,
      expired: formattedCertificates.filter((c) => c.isExpired).length
    };
    return {
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        pinfl: student.pinfl ? `***${student.pinfl.slice(-4)}` : null,
        pinflFull: student.pinfl,
        // Полный ПИНФЛ для представителя
        position: student.position || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430",
        department: student.department,
        organizationName: student.organizationName,
        registeredAt: student.createdAt ? new Date(student.createdAt).toLocaleDateString("ru-RU") : null
      },
      certificates: formattedCertificates,
      stats
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
