/**
 * GET /api/certificates/org-stats
 * Статистика сертификатов по организациям
 */

import { executeQuery } from "../../utils/db";
import type { RowDataPacket } from "mysql2/promise";
import { logActivity } from "../../utils/activityLogger";

interface OrgStatRow extends RowDataPacket {
  organization: string;
  total: number;
  issued: number;
  revoked: number;
  latest_date: Date | null;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const search = (query.search as string) || "";
    const limit = Math.min(parseInt((query.limit as string) || "50", 10), 200);
    const offset = parseInt((query.offset as string) || "0", 10);

    let baseWhere = "WHERE s.organization IS NOT NULL AND s.organization != ''";
    const params: any[] = [];

    if (search) {
      baseWhere += " AND s.organization LIKE ?";
      params.push(`%${search}%`);
    }

    const statsQuery = `
      SELECT
        s.organization,
        COUNT(*)                                                    AS total,
        SUM(CASE WHEN ic.status = 'issued'  THEN 1 ELSE 0 END)    AS issued,
        SUM(CASE WHEN ic.status = 'revoked' THEN 1 ELSE 0 END)    AS revoked,
        MAX(ic.issue_date)                                          AS latest_date
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      ${baseWhere}
      GROUP BY s.organization
      ORDER BY total DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT s.organization) AS cnt
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      ${baseWhere}
    `;

    const [countRow] = await executeQuery<RowDataPacket[]>(countQuery, params);
    const total = (countRow as any)?.[0]?.cnt || 0;

    // Общая сумма выданных
    const summaryQuery = `
      SELECT COUNT(*) as totalIssued
      FROM issued_certificates ic
      WHERE ic.status = 'issued'
    `;
    const [summaryResult] = await executeQuery<RowDataPacket[]>(summaryQuery);
    const totalIssued = (summaryResult as any)?.[0]?.totalIssued || 0;

    const rows = await executeQuery<OrgStatRow[]>(statsQuery, [
      ...params,
      limit,
      offset,
    ]);

    await logActivity(
      event,
      "VIEW",
      "ISSUED_CERTIFICATE",
      undefined,
      "Просмотр статистики сертификатов по организациям",
    );

    return {
      success: true,
      data: {
        items: rows.map((r) => ({
          organization: r.organization,
          total: Number(r.total),
          issued: Number(r.issued),
          revoked: Number(r.revoked),
          latestDate: r.latest_date,
        })),
        total,
        stats: {
          totalIssued
        }
      },
    };
  } catch (error: any) {
    console.error("[GET /api/certificates/org-stats] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка получения статистики по организациям",
    });
  }
});
