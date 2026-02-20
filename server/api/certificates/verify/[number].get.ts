import { executeQuery } from "../../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

/**
 * Публичный API для верификации сертификата по его номеру
 * GET /api/certificates/verify/:number
 *
 * Не требует авторизации — предназначен для сканирования QR-кода.
 * Возвращает только публичные данные (без внутренних ID, ПИНФЛ и т.п.)
 */

interface CertificateVerifyRow extends RowDataPacket {
  id: string;
  certificate_number: string;
  issue_date: Date;
  expiry_date: Date | null;
  status: "issued" | "revoked";
  revoked_at: Date | null;
  revoke_reason: string | null;
  // Студент
  student_name: string;
  student_organization: string | null;
  student_position: string | null;
  // Группа
  group_code: string | null;
  standalone_group_code: string | null;
  standalone_group_start_date: Date | null;
  standalone_group_end_date: Date | null;
  // Курс
  course_name: string | null;
  course_code: string | null;
  standalone_course_name: string | null;
  standalone_course_code: string | null;
  standalone_course_hours: number | null;
  // Организация (кто выдал)
  org_name: string | null;
  issued_at: Date | null;
}

export default defineEventHandler(async (event) => {
  const number = getRouterParam(event, "number");

  if (!number) {
    throw createError({
      statusCode: 400,
      message: "Номер сертификата не указан",
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
        ic.revoked_at,
        ic.revoke_reason,
        s.full_name        AS student_name,
        s.organization     AS student_organization,
        s.position         AS student_position,
        g.code             AS group_code,
        ic.group_code      AS standalone_group_code,
        ic.group_start_date AS standalone_group_start_date,
        ic.group_end_date   AS standalone_group_end_date,
        c.name             AS course_name,
        c.code             AS course_code,
        ic.course_name     AS standalone_course_name,
        ic.course_code     AS standalone_course_code,
        ic.course_hours    AS standalone_course_hours,
        o.name             AS org_name,
        ic.issued_at
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE ic.certificate_number = ?
      LIMIT 1
    `;

    const rows = await executeQuery<CertificateVerifyRow[]>(query, [number]);

    if (!rows || rows.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Сертификат не найден",
      });
    }

    const row = rows[0];

    // Определяем фактический статус с учётом срока действия
    const now = new Date();
    const isExpired = row.expiry_date ? new Date(row.expiry_date) < now : false;

    let verificationStatus: "valid" | "expired" | "revoked" = "valid";
    if (row.status === "revoked") {
      verificationStatus = "revoked";
    } else if (isExpired) {
      verificationStatus = "expired";
    }

    // Логируем факт верификации (без записи в activity_logs, т.к. запрос анонимный)
    console.log(
      `[verify] Certificate ${number} checked — status: ${verificationStatus},` +
        ` ip: ${getRequestIP(event, { xForwardedFor: true }) ?? "unknown"}`,
    );

    return {
      success: true,
      verificationStatus,
      certificate: {
        number: row.certificate_number,
        issueDate: row.issue_date,
        expiryDate: row.expiry_date,
        issuedAt: row.issued_at,
        revokedAt: row.revoked_at,
        revokeReason: row.revoke_reason,
        student: {
          fullName: row.student_name,
          organization: row.student_organization,
          position: row.student_position,
        },
        group: {
          code: row.group_code || row.standalone_group_code || null,
          startDate: row.standalone_group_start_date,
          endDate: row.standalone_group_end_date,
        },
        course: {
          name: row.course_name || row.standalone_course_name || null,
          code: row.course_code || row.standalone_course_code || null,
          hours: row.standalone_course_hours,
        },
        issuer: {
          organizationName: row.org_name,
        },
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("[GET /api/certificates/verify/:number] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка верификации сертификата",
    });
  }
});
