/**
 * GET /api/public/stats
 * Публичная статистика для страницы верификации сертификатов.
 *
 * Не требует авторизации.
 * Данные кэшируются на 1 час через Cache-Control.
 * Rate limiting применяется через middleware/publicRateLimiter.ts
 */

import { executeQuery } from "../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface StatsRow extends RowDataPacket {
  total_certificates: number;
  total_organizations: number;
  total_verifications: number;
  min_year: number | null;
}

export default defineEventHandler(async (event) => {
  try {
    // Агрегированная статистика — только публичные, безопасные данные
    const [stats] = await executeQuery<StatsRow[]>(`
      SELECT
        COUNT(ic.id)                                  AS total_certificates,
        COUNT(DISTINCT s.organization_id)              AS total_organizations,
        (SELECT COUNT(*) FROM certificate_verification_logs
         WHERE result = 'found')                       AS total_verifications,
        YEAR(MIN(ic.issue_date))                       AS min_year
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      WHERE ic.status = 'issued'
    `);

    // Кэшируем на 1 час — данные не чувствительны и меняются редко
    setHeader(event, "Cache-Control", "public, max-age=3600, stale-while-revalidate=600");
    setHeader(event, "X-Content-Type-Options", "nosniff");

    return {
      success: true,
      data: {
        totalCertificates:  stats?.total_certificates  ?? 0,
        totalOrganizations: stats?.total_organizations ?? 0,
        totalVerifications: stats?.total_verifications ?? 0,
        since:              stats?.min_year ?? new Date().getFullYear(),
      },
    };
  } catch (error: any) {
    console.error("[GET /api/public/stats] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка получения статистики",
    });
  }
});
