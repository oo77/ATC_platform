import { d as defineEventHandler, e as executeQuery, c as createError } from '../../../nitro/nitro.mjs';
import { b as requirePermission, g as getStudentByUserId, P as Permission } from '../../../_/permissions.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const my_get = defineEventHandler(async (event) => {
  console.log("[API] GET /api/certificates/my - \u0417\u0430\u043F\u0440\u043E\u0441 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F");
  const context = await requirePermission(event, Permission.CERTIFICATES_VIEW_OWN);
  const student = await getStudentByUserId(context.userId);
  if (!student) {
    console.log(`[API] \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ${context.userId} \u043D\u0435 \u0441\u0432\u044F\u0437\u0430\u043D \u0441\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u043C`);
    return {
      success: true,
      certificates: []
    };
  }
  console.log(`[API] \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 ${student.id} (${student.fullName})`);
  try {
    const certificates = await executeQuery(`
      SELECT 
        ic.id,
        ic.certificate_number,
        ic.issue_date,
        ic.expiry_date,
        ic.status,
        ic.source_type,
        ic.pdf_file_url,
        -- \u0414\u0430\u043D\u043D\u044B\u0435 \u043A\u0443\u0440\u0441\u0430 \u0438\u0437 \u0441\u0432\u044F\u0437\u0438 (\u0434\u043B\u044F group_journal)
        c.name as linked_course_name,
        c.code as linked_course_code,
        -- Standalone \u0434\u0430\u043D\u043D\u044B\u0435 \u043A\u0443\u0440\u0441\u0430 (\u0434\u043B\u044F import/manual)
        ic.course_name as standalone_course_name,
        ic.course_code as standalone_course_code,
        ic.course_hours as standalone_course_hours,
        -- \u0414\u0430\u043D\u043D\u044B\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u0438\u0437 \u0441\u0432\u044F\u0437\u0438
        g.code as linked_group_code,
        -- Standalone \u0434\u0430\u043D\u043D\u044B\u0435 \u0433\u0440\u0443\u043F\u043F\u044B
        ic.group_code as standalone_group_code
      FROM issued_certificates ic
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE ic.student_id = ?
        AND ic.status = 'issued'
      ORDER BY ic.issue_date DESC
    `, [student.id]);
    const result = certificates.map((cert) => ({
      id: cert.id,
      certificateNumber: cert.certificate_number,
      // Приоритет: linked > standalone > пустая строка
      courseName: cert.linked_course_name || cert.standalone_course_name || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
      courseCode: cert.linked_course_code || cert.standalone_course_code || null,
      courseHours: cert.standalone_course_hours || null,
      groupCode: cert.linked_group_code || cert.standalone_group_code || null,
      status: cert.status,
      sourceType: cert.source_type,
      issuedAt: cert.issue_date,
      expiresAt: cert.expiry_date,
      fileUrl: cert.pdf_file_url
    }));
    await logActivity(
      event,
      "VIEW",
      "ISSUED_CERTIFICATE",
      void 0,
      void 0,
      { message: `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u0432\u043E\u0438\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 (${result.length} \u0448\u0442.)` }
    );
    console.log(`[API] \u041D\u0430\u0439\u0434\u0435\u043D\u043E ${result.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 ${student.id}`);
    return {
      success: true,
      certificates: result
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432"
    });
  }
});

export { my_get as default };
//# sourceMappingURL=my.get.mjs.map
