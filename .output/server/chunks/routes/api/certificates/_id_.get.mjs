import { g as defineEventHandler, j as getRouterParam, h as createError, f as executeQuery } from '../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const _id__get = defineEventHandler(async (event) => {
  console.log("[DEBUG] GET /api/certificates/:id called");
  console.log("[DEBUG] event.context.params:", event.context.params);
  const id = getRouterParam(event, "id");
  console.log("[DEBUG] id:", id);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D ID \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
    });
  }
  try {
    const query = `
      SELECT 
        ic.id,
        ic.certificate_number,
        ic.issue_date,
        ic.expiry_date,
        ic.status,
        ic.source_type,
        ic.import_source,
        ic.ai_confidence,
        ic.pdf_file_url,
        ic.docx_file_url,
        ic.student_id,
        s.full_name as student_name,
        s.organization as student_organization,
        s.position as student_position,
        s.pinfl as student_pinfl,
        ic.group_id,
        g.code as group_code,
        ic.group_code as standalone_group_code,
        ic.group_start_date as standalone_group_start_date,
        ic.group_end_date as standalone_group_end_date,
        c.name as course_name,
        c.code as course_code,
        ic.course_name as standalone_course_name,
        ic.course_code as standalone_course_code,
        ic.course_hours as standalone_course_hours,
        ic.template_id,
        ct.name as template_name,
        ic.issued_by,
        u.name as issued_by_name,
        ic.issued_at,
        ic.revoked_at,
        ic.revoke_reason,
        ic.warnings IS NOT NULL AND JSON_LENGTH(ic.warnings) > 0 as has_warnings,
        ic.notes,
        ic.created_at
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
      LEFT JOIN users u ON ic.issued_by = u.id
      WHERE ic.id = ?
    `;
    const [certificates] = await executeQuery(query, [id]);
    if (!certificates || certificates.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const row = certificates[0];
    const certificate = {
      id: row.id,
      certificateNumber: row.certificate_number,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      status: row.status,
      sourceType: row.source_type,
      importSource: row.import_source,
      aiConfidence: row.ai_confidence,
      pdfFileUrl: row.pdf_file_url,
      docxFileUrl: row.docx_file_url,
      student: {
        id: row.student_id,
        fullName: row.student_name,
        organization: row.student_organization,
        position: row.student_position,
        pinfl: row.student_pinfl
      },
      group: {
        id: row.group_id,
        code: row.group_code || row.standalone_group_code || null,
        startDate: row.standalone_group_start_date,
        endDate: row.standalone_group_end_date
      },
      course: {
        name: row.course_name || row.standalone_course_name || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
        code: row.course_code || row.standalone_course_code || null,
        hours: row.standalone_course_hours
      },
      template: row.template_id ? {
        id: row.template_id,
        name: row.template_name
      } : null,
      issuedBy: row.issued_by ? {
        id: row.issued_by,
        name: row.issued_by_name
      } : null,
      issuedAt: row.issued_at,
      revokedAt: row.revoked_at,
      revokeReason: row.revoke_reason,
      hasWarnings: Boolean(row.has_warnings),
      notes: row.notes,
      createdAt: row.created_at
    };
    await logActivity(
      event,
      "VIEW",
      "ISSUED_CERTIFICATE",
      id,
      `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${row.certificate_number}`
    );
    return {
      success: true,
      certificate
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("[GET /api/certificates/:id] Error:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
