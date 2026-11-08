/**
 * GET /api/certificates/analytics
 * Подробная аналитика по базе сертификатов.
 * Параметры: months (3..36, по умолчанию 12), organizationName (опционально).
 * Все счётчики считаются по таблице issued_certificates, «действующий» = status 'issued'.
 */

import { z } from "zod";
import { executeQuery } from "../../utils/db";
import { Permission, requirePermission } from "../../utils/permissions";

const querySchema = z.object({
  months: z
    .string()
    .optional()
    .transform((v) => Math.min(36, Math.max(3, parseInt(v || "12", 10) || 12))),
  organizationName: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.CERTIFICATES_VIEW_ALL);

  try {
    const params = querySchema.parse(getQuery(event));

    let where = "WHERE 1=1";
    const p: any[] = [];
    if (params.organizationName) {
      where += " AND s.organization LIKE ?";
      p.push(`%${params.organizationName}%`);
    }
    const from = `FROM issued_certificates ic JOIN students s ON ic.student_id = s.id`;

    const [
      summary,
      byMonth,
      bySource,
      topOrgs,
      topCourses,
      byTemplate,
      revokeReasons,
      expiring,
    ] = await Promise.all([
      executeQuery<any[]>(
        `SELECT
          COUNT(*) AS total,
          COALESCE(SUM(ic.status='issued'),0) AS issued,
          COALESCE(SUM(ic.status='revoked'),0) AS revoked,
          COUNT(DISTINCT ic.student_id) AS students,
          COUNT(DISTINCT NULLIF(TRIM(s.organization),'')) AS organizations,
          COALESCE(SUM(ic.status='issued' AND ic.expiry_date IS NOT NULL AND ic.expiry_date < CURDATE()),0) AS expired,
          COALESCE(SUM(ic.status='issued' AND ic.expiry_date IS NOT NULL AND ic.expiry_date >= CURDATE() AND ic.expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY)),0) AS expiring_30,
          COALESCE(SUM(ic.status='issued' AND ic.expiry_date IS NOT NULL AND ic.expiry_date >= CURDATE() AND ic.expiry_date < DATE_ADD(CURDATE(), INTERVAL 90 DAY)),0) AS expiring_90,
          COALESCE(SUM(ic.status='issued' AND ic.expiry_date IS NULL),0) AS unlimited,
          COALESCE(SUM(ic.pdf_file_url IS NULL AND ic.status='issued'),0) AS without_pdf,
          COALESCE(SUM(ic.status='issued' AND ic.warnings IS NOT NULL AND JSON_LENGTH(ic.warnings) > 0),0) AS with_warnings,
          COALESCE(SUM(ic.status='issued' AND ic.issue_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')),0) AS this_month,
          COALESCE(SUM(ic.status='issued' AND ic.issue_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) AND ic.issue_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')),0) AS prev_month,
          COALESCE(SUM(ic.status='issued' AND YEAR(ic.issue_date) = YEAR(CURDATE())),0) AS this_year
         ${from} ${where}`,
        p,
      ),
      executeQuery<any[]>(
        `SELECT DATE_FORMAT(ic.issue_date,'%Y-%m') AS month,
          COALESCE(SUM(ic.status='issued'),0) AS issued,
          COALESCE(SUM(ic.status='revoked'),0) AS revoked
         ${from} ${where}
          AND ic.issue_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
         GROUP BY month ORDER BY month`,
        [...p, params.months - 1],
      ),
      executeQuery<any[]>(
        `SELECT
          CASE WHEN ic.source_type='import' AND ic.import_source='ai' THEN 'ai'
               WHEN ic.source_type='import' THEN 'excel'
               ELSE ic.source_type END AS source,
          COUNT(*) AS cnt
         ${from} ${where} AND ic.status='issued' GROUP BY source`,
        p,
      ),
      executeQuery<any[]>(
        `SELECT s.organization AS name, COUNT(*) AS total,
          COALESCE(SUM(ic.status='issued'),0) AS issued,
          COALESCE(SUM(ic.status='revoked'),0) AS revoked,
          COUNT(DISTINCT ic.student_id) AS students
         ${from} ${where} AND s.organization IS NOT NULL AND s.organization <> ''
         GROUP BY s.organization ORDER BY total DESC LIMIT 10`,
        p,
      ),
      executeQuery<any[]>(
        `SELECT COALESCE(c.name, ic.course_name, 'Не указан') AS name, COUNT(*) AS total
         FROM issued_certificates ic JOIN students s ON ic.student_id = s.id
         LEFT JOIN study_groups g ON ic.group_id = g.id
         LEFT JOIN courses c ON g.course_id = c.id
         ${where} AND ic.status='issued'
         GROUP BY name ORDER BY total DESC LIMIT 10`,
        p,
      ),
      executeQuery<any[]>(
        `SELECT COALESCE(ct.name, 'Без шаблона') AS name, COUNT(*) AS total
         FROM issued_certificates ic JOIN students s ON ic.student_id = s.id
         LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
         ${where} AND ic.status='issued'
         GROUP BY name ORDER BY total DESC LIMIT 8`,
        p,
      ),
      executeQuery<any[]>(
        `SELECT COALESCE(NULLIF(TRIM(ic.revoke_reason),''),'Причина не указана') AS reason, COUNT(*) AS cnt
         ${from} ${where} AND ic.status='revoked'
         GROUP BY reason ORDER BY cnt DESC LIMIT 5`,
        p,
      ),
      executeQuery<any[]>(
        `SELECT ic.id, ic.certificate_number, ic.expiry_date, s.full_name, s.organization,
          DATEDIFF(ic.expiry_date, CURDATE()) AS days_left
         ${from} ${where} AND ic.status='issued' AND ic.expiry_date IS NOT NULL
          AND ic.expiry_date >= CURDATE() AND ic.expiry_date < DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         ORDER BY ic.expiry_date LIMIT 10`,
        p,
      ),
    ]);

    const sm = summary[0] || {};
    const n = (v: any) => Number(v) || 0;

    // Заполняем пропущенные месяцы нулями
    const map = new Map(byMonth.map((r) => [r.month, r]));
    const timeline: { month: string; issued: number; revoked: number }[] = [];
    const now = new Date();
    for (let i = params.months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const r = map.get(key);
      timeline.push({ month: key, issued: n(r?.issued), revoked: n(r?.revoked) });
    }

    return {
      success: true,
      data: {
        summary: {
          total: n(sm.total),
          issued: n(sm.issued),
          revoked: n(sm.revoked),
          students: n(sm.students),
          organizations: n(sm.organizations),
          expired: n(sm.expired),
          expiring30: n(sm.expiring_30),
          expiring90: n(sm.expiring_90),
          unlimited: n(sm.unlimited),
          withoutPdf: n(sm.without_pdf),
          withWarnings: n(sm.with_warnings),
          thisMonth: n(sm.this_month),
          prevMonth: n(sm.prev_month),
          thisYear: n(sm.this_year),
        },
        timeline,
        bySource: bySource.map((r) => ({ source: r.source, count: n(r.cnt) })),
        topOrganizations: topOrgs.map((r) => ({
          name: r.name, total: n(r.total), issued: n(r.issued), revoked: n(r.revoked), students: n(r.students),
        })),
        topCourses: topCourses.map((r) => ({ name: r.name, total: n(r.total) })),
        byTemplate: byTemplate.map((r) => ({ name: r.name, total: n(r.total) })),
        revokeReasons: revokeReasons.map((r) => ({ reason: r.reason, count: n(r.cnt) })),
        expiringSoon: expiring.map((r) => ({
          id: r.id, certificateNumber: r.certificate_number, expiryDate: r.expiry_date,
          studentName: r.full_name, organization: r.organization, daysLeft: n(r.days_left),
        })),
      },
    };
  } catch (error: any) {
    console.error("[GET /api/certificates/analytics] Error:", error);
    if (error.name === "ZodError") {
      throw createError({ statusCode: 400, message: "Ошибка валидации параметров" });
    }
    throw createError({ statusCode: 500, message: error.message || "Ошибка получения аналитики" });
  }
});
