import { z } from "zod";
import { executeQuery } from "../../utils/db";
import {
  createCertificatesArchive,
  type CertificatesArchiveGroupBy,
} from "../../services/certificateArchiveService";
import { Permission, requirePermission } from "../../utils/permissions";

// Ограничение на число файлов в одном архиве, собранном по фильтрам
// (список конкретных certificateIds ограничен отдельно — до 200)
const MAX_FILTERED_CERTIFICATES = 3000;

const filtersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["issued", "revoked", "all"]).optional().default("issued"),
  sourceType: z
    .enum(["group_journal", "manual", "import", "ai", "excel", "all"])
    .optional()
    .default("all"),
  groupId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  organizationName: z.string().optional(),
  courseName: z.string().optional(),
  groupCode: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

function resolveGroupBy(body: any): CertificatesArchiveGroupBy {
  if (body?.groupBy === "organization" || body?.groupBy === "group" || body?.groupBy === "course") {
    return body.groupBy;
  }
  if (body?.byOrganization === true) return "organization";
  return "none";
}

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requirePermission(event, Permission.CERTIFICATES_VIEW_ALL);

  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Для скачивания архива требуется авторизация",
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const certificateIds: string[] = Array.isArray(body?.certificateIds)
    ? body.certificateIds
    : [];
  const groupBy = resolveGroupBy(body);

  let certificates: any[];
  let filenameBase = "certificates_archive";

  if (certificateIds.length > 0) {
    // Ограничение до 200 файлов в одном архиве
    const safeIds = certificateIds.slice(0, 200);
    const placeholders = safeIds.map(() => "?").join(",");

    certificates = await executeQuery<any[]>(
      `SELECT
        ic.id,
        ic.certificate_number,
        ic.pdf_file_url,
        ic.docx_file_url,
        ic.issue_date,
        s.full_name as student_name,
        c.name as course_name,
        o.name as organization_name,
        g.code as group_code
      FROM issued_certificates ic
      LEFT JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE ic.id IN (${placeholders})`,
      safeIds,
    );
  } else {
    // Та же фильтрация, что и в GET /api/certificates — архив строится
    // по текущим фильтрам страницы «Сертификаты», а не по списку id
    const parsed = filtersSchema.parse(body?.filters || {});

    let sql = `
      SELECT
        ic.id,
        ic.certificate_number,
        ic.pdf_file_url,
        ic.docx_file_url,
        ic.issue_date,
        s.full_name as student_name,
        s.organization as organization_name,
        COALESCE(c.name, ic.course_name) as course_name,
        COALESCE(g.code, ic.group_code) as group_code
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE ic.pdf_file_url IS NOT NULL
    `;
    const params: any[] = [];

    if (parsed.status !== "all") {
      sql += " AND ic.status = ?";
      params.push(parsed.status);
    }

    if (parsed.sourceType && parsed.sourceType !== "all") {
      if (parsed.sourceType === "ai") {
        sql += " AND ic.source_type = 'import' AND ic.import_source = 'ai'";
      } else if (parsed.sourceType === "excel") {
        sql +=
          " AND ic.source_type = 'import' AND (ic.import_source = 'excel' OR ic.import_source IS NULL)";
      } else {
        sql += " AND ic.source_type = ?";
        params.push(parsed.sourceType);
      }
    }

    if (parsed.search) {
      sql += ` AND (
        s.full_name LIKE ?
        OR ic.certificate_number LIKE ?
        OR s.pinfl LIKE ?
        OR ic.course_name LIKE ?
        OR ic.course_code LIKE ?
      )`;
      const searchPattern = `%${parsed.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (parsed.groupId) {
      sql += " AND ic.group_id = ?";
      params.push(parsed.groupId);
    }

    if (parsed.templateId) {
      sql += " AND ic.template_id = ?";
      params.push(parsed.templateId);
    }

    if (parsed.organizationName) {
      sql += " AND s.organization LIKE ?";
      params.push(`%${parsed.organizationName}%`);
    }

    if (parsed.courseName) {
      sql += " AND COALESCE(c.name, ic.course_name) = ?";
      params.push(parsed.courseName);
    }

    if (parsed.groupCode) {
      sql += " AND COALESCE(g.code, ic.group_code) = ?";
      params.push(parsed.groupCode);
    }

    if (parsed.dateFrom) {
      sql += " AND DATE(ic.issue_date) >= ?";
      params.push(parsed.dateFrom);
    }

    if (parsed.dateTo) {
      sql += " AND DATE(ic.issue_date) <= ?";
      params.push(parsed.dateTo);
    }

    sql += ` ORDER BY ic.issue_date DESC LIMIT ${MAX_FILTERED_CERTIFICATES}`;

    certificates = await executeQuery<any[]>(sql, params);
    filenameBase = `certificates_${groupBy !== "none" ? groupBy + "_" : ""}${new Date()
      .toISOString()
      .slice(0, 10)}`;
  }

  if (!certificates || certificates.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Сертификаты не найдены",
    });
  }

  const filename = `${filenameBase}.zip`;

  setHeader(event, "Content-Type", "application/zip");
  setHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);

  try {
    return await createCertificatesArchive(certificates, { groupBy });
  } catch (error: any) {
    throw createError({
      statusCode: 404,
      message: error.message || "Не удалось создать архив сертификатов",
    });
  }
});
