import { executeQuery } from "../../utils/db";
import type { RowDataPacket } from "mysql2/promise";
import { logActivity } from "../../utils/activityLogger";
import { getRouterParam } from "h3";

interface CertificateRow extends RowDataPacket {
  id: string;
  certificate_number: string;
  issue_date: Date;
  expiry_date: Date | null;
  status: string;
  source_type: "group_journal" | "manual" | "import";
  import_source: string | null;
  ai_confidence: number | null;
  pdf_file_url: string | null;
  docx_file_url: string | null;
  // Студент
  student_id: string;
  student_name: string;
  student_organization: string | null;
  student_position: string | null;
  student_pinfl: string | null;
  // Группа (из связи или standalone)
  group_id: string | null;
  group_code: string | null;
  standalone_group_code: string | null;
  standalone_group_start_date: Date | null;
  standalone_group_end_date: Date | null;
  // Курс (из связи или standalone)
  course_name: string | null;
  course_code: string | null;
  standalone_course_name: string | null;
  standalone_course_code: string | null;
  standalone_course_hours: number | null;
  // Шаблон (опционально)
  template_id: string | null;
  template_name: string | null;
  // Аудит
  issued_by: string | null;
  issued_by_name: string | null;
  issued_at: Date | null;
  revoked_at: Date | null;
  revoke_reason: string | null;
  has_warnings: boolean;
  notes: string | null;
  created_at: Date;
}

export default defineEventHandler(async (event) => {
  console.log("[DEBUG] GET /api/certificates/:id called");
  console.log("[DEBUG] event.context.params:", event.context.params);

  const id = getRouterParam(event, "id");
  console.log("[DEBUG] id:", id);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Не указан ID сертификата",
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

    const [certificates] = await executeQuery<CertificateRow[]>(query, [id]);

    if (!certificates || certificates.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Сертификат не найден",
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
        pinfl: row.student_pinfl,
      },
      group: {
        id: row.group_id,
        code: row.group_code || row.standalone_group_code || null,
        startDate: row.standalone_group_start_date,
        endDate: row.standalone_group_end_date,
      },
      course: {
        name: row.course_name || row.standalone_course_name || "Не указан",
        code: row.course_code || row.standalone_course_code || null,
        hours: row.standalone_course_hours,
      },
      template: row.template_id
        ? {
            id: row.template_id,
            name: row.template_name,
          }
        : null,
      issuedBy: row.issued_by
        ? {
            id: row.issued_by,
            name: row.issued_by_name,
          }
        : null,
      issuedAt: row.issued_at,
      revokedAt: row.revoked_at,
      revokeReason: row.revoke_reason,
      hasWarnings: Boolean(row.has_warnings),
      notes: row.notes,
      createdAt: row.created_at,
    };

    // Логируем просмотр
    await logActivity(
      event,
      "VIEW",
      "ISSUED_CERTIFICATE",
      id,
      `Просмотр деталей сертификата ${row.certificate_number}`,
    );

    return {
      success: true,
      certificate,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[GET /api/certificates/:id] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка получения данных сертификата",
    });
  }
});
