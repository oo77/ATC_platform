/**
 * Статистика выданных сертификатов по шаблону и подбор сертификатов
 * для массовой перерисовки.
 *
 * «Можно перерисовать» = выдан (status = 'issued'), источник — журнал группы,
 * есть группа и слушатель (иначе нечем собирать данные для переменных).
 */

import { executeQuery } from "../utils/db";

const REGENERABLE_SQL = `ic.status = 'issued' AND ic.source_type = 'group_journal'
  AND ic.group_id IS NOT NULL AND ic.student_id IS NOT NULL`;

const n = (v: any) => Number(v) || 0;

export type RegenerateScope = "outdated" | "all";

export async function getTemplateStats(templateId: string, currentHash: string | null) {
  const hash = currentHash || "";
  const [summary, timeline, orgs, courses, sources, usage] = await Promise.all([
    executeQuery<any[]>(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(ic.status='issued'),0) AS issued,
        COALESCE(SUM(ic.status='revoked'),0) AS revoked,
        COUNT(DISTINCT ic.student_id) AS students,
        COUNT(DISTINCT NULLIF(TRIM(s.organization),'')) AS organizations,
        COUNT(DISTINCT ic.group_id) AS \`groups\`,
        MIN(ic.issue_date) AS first_issue,
        MAX(ic.issue_date) AS last_issue,
        COALESCE(SUM(ic.status='issued' AND ic.issue_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')),0) AS this_month,
        COALESCE(SUM(ic.status='issued' AND YEAR(ic.issue_date) = YEAR(CURDATE())),0) AS this_year,
        COALESCE(SUM(ic.status='issued' AND ic.expiry_date IS NOT NULL AND ic.expiry_date < CURDATE()),0) AS expired,
        COALESCE(SUM(ic.status='issued' AND ic.pdf_file_url IS NULL),0) AS without_pdf,
        COALESCE(SUM(${REGENERABLE_SQL}),0) AS regenerable,
        COALESCE(SUM(${REGENERABLE_SQL} AND ic.render_hash = ?),0) AS rendered_current,
        COALESCE(SUM(${REGENERABLE_SQL} AND ic.render_hash IS NOT NULL AND ic.render_hash <> ?),0) AS rendered_outdated,
        COALESCE(SUM(${REGENERABLE_SQL} AND ic.render_hash IS NULL),0) AS rendered_unknown,
        MAX(ic.rendered_at) AS last_rendered_at
       FROM issued_certificates ic
       LEFT JOIN students s ON ic.student_id = s.id
       WHERE ic.template_id = ?`,
      [hash, hash, templateId],
    ),
    executeQuery<any[]>(
      `SELECT DATE_FORMAT(ic.issue_date,'%Y-%m') AS month,
        COALESCE(SUM(ic.status='issued'),0) AS issued,
        COALESCE(SUM(ic.status='revoked'),0) AS revoked
       FROM issued_certificates ic
       WHERE ic.template_id = ?
        AND ic.issue_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
       GROUP BY month ORDER BY month`,
      [templateId],
    ),
    executeQuery<any[]>(
      `SELECT s.organization AS name, COUNT(*) AS total
       FROM issued_certificates ic JOIN students s ON ic.student_id = s.id
       WHERE ic.template_id = ? AND ic.status='issued' AND s.organization IS NOT NULL AND s.organization <> ''
       GROUP BY s.organization ORDER BY total DESC LIMIT 5`,
      [templateId],
    ),
    executeQuery<any[]>(
      `SELECT COALESCE(c.name, ic.course_name, 'Не указан') AS name, COUNT(*) AS total
       FROM issued_certificates ic
       LEFT JOIN study_groups g ON ic.group_id = g.id
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE ic.template_id = ? AND ic.status='issued'
       GROUP BY name ORDER BY total DESC LIMIT 5`,
      [templateId],
    ),
    executeQuery<any[]>(
      `SELECT ic.source_type AS source, COUNT(*) AS cnt
       FROM issued_certificates ic WHERE ic.template_id = ? AND ic.status='issued' GROUP BY ic.source_type`,
      [templateId],
    ),
    executeQuery<any[]>(
      `SELECT COUNT(*) AS courses FROM courses WHERE certificate_template_id = ?`,
      [templateId],
    ),
  ]);

  const sm = summary[0] || {};
  const map = new Map(timeline.map((r) => [r.month, r]));
  const months: { month: string; issued: number; revoked: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const r = map.get(key);
    months.push({ month: key, issued: n(r?.issued), revoked: n(r?.revoked) });
  }

  const issued = n(sm.issued);
  const regenerable = n(sm.regenerable);
  return {
    summary: {
      total: n(sm.total),
      issued,
      revoked: n(sm.revoked),
      students: n(sm.students),
      organizations: n(sm.organizations),
      groups: n(sm.groups),
      firstIssue: sm.first_issue || null,
      lastIssue: sm.last_issue || null,
      thisMonth: n(sm.this_month),
      thisYear: n(sm.this_year),
      expired: n(sm.expired),
      withoutPdf: n(sm.without_pdf),
      courses: n(usage[0]?.courses),
    },
    render: {
      regenerable,
      current: n(sm.rendered_current),
      outdated: n(sm.rendered_outdated),
      unknown: n(sm.rendered_unknown),
      notRegenerable: Math.max(0, issued - regenerable),
      lastRenderedAt: sm.last_rendered_at || null,
    },
    timeline: months,
    topOrganizations: orgs.map((r) => ({ name: r.name, total: n(r.total) })),
    topCourses: courses.map((r) => ({ name: r.name, total: n(r.total) })),
    bySource: sources.map((r) => ({ source: r.source, count: n(r.cnt) })),
  };
}

/** ID сертификатов для перерисовки; «outdated» = версия неизвестна или отличается */
export async function listRegenerableCertificateIds(
  templateId: string,
  scope: RegenerateScope,
  currentHash: string,
): Promise<string[]> {
  const rows = await executeQuery<any[]>(
    `SELECT ic.id FROM issued_certificates ic
     WHERE ic.template_id = ? AND ${REGENERABLE_SQL}
       ${scope === "outdated" ? "AND (ic.render_hash IS NULL OR ic.render_hash <> ?)" : ""}
     ORDER BY ic.issue_date, ic.certificate_number`,
    scope === "outdated" ? [templateId, currentHash] : [templateId],
  );
  return rows.map((r) => r.id);
}
