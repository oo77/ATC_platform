import { d as defineEventHandler, g as getQuery, e as executeQuery, c as createError } from '../../nitro/nitro.mjs';
import { z } from 'zod';
import { l as logActivity } from '../../_/activityLogger.mjs';
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
import '../../_/activityLogRepository.mjs';

const querySchema = z.object({
  page: z.string().optional().transform((v) => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform((v) => v ? parseInt(v, 10) : 20),
  search: z.string().optional(),
  status: z.enum(["issued", "revoked", "all"]).optional().default("all"),
  sourceType: z.enum(["group_journal", "manual", "import", "all"]).optional().default("all"),
  groupId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  organizationName: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["issue_date", "student_name", "certificate_number", "course_name"]).optional().default("issue_date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
});
const index_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = querySchema.parse(query);
    let baseQuery = `
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
      LEFT JOIN users u ON ic.issued_by = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    if (params.status && params.status !== "all") {
      baseQuery += " AND ic.status = ?";
      queryParams.push(params.status);
    }
    if (params.sourceType && params.sourceType !== "all") {
      baseQuery += " AND ic.source_type = ?";
      queryParams.push(params.sourceType);
    }
    if (params.search) {
      baseQuery += ` AND (
        s.full_name LIKE ? 
        OR ic.certificate_number LIKE ? 
        OR s.pinfl LIKE ?
        OR ic.course_name LIKE ?
        OR ic.course_code LIKE ?
      )`;
      const searchPattern = `%${params.search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    if (params.groupId) {
      baseQuery += " AND ic.group_id = ?";
      queryParams.push(params.groupId);
    }
    if (params.templateId) {
      baseQuery += " AND ic.template_id = ?";
      queryParams.push(params.templateId);
    }
    if (params.organizationName) {
      baseQuery += " AND s.organization LIKE ?";
      queryParams.push(`%${params.organizationName}%`);
    }
    if (params.dateFrom) {
      baseQuery += " AND DATE(ic.issue_date) >= ?";
      queryParams.push(params.dateFrom);
    }
    if (params.dateTo) {
      baseQuery += " AND DATE(ic.issue_date) <= ?";
      queryParams.push(params.dateTo);
    }
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await executeQuery(countQuery, queryParams);
    const total = countResult?.total || 0;
    let orderBy = "ic.issue_date";
    switch (params.sortBy) {
      case "student_name":
        orderBy = "s.full_name";
        break;
      case "certificate_number":
        orderBy = "ic.certificate_number";
        break;
      case "course_name":
        orderBy = "COALESCE(c.name, ic.course_name)";
        break;
    }
    const selectQuery = `
      SELECT 
        ic.id,
        ic.certificate_number,
        ic.issue_date,
        ic.expiry_date,
        ic.status,
        ic.source_type,
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
      ${baseQuery}
      ORDER BY ${orderBy} ${params.sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    const offset = (params.page - 1) * params.limit;
    const dataParams = [...queryParams, params.limit, offset];
    const certificates = await executeQuery(selectQuery, dataParams);
    const items = certificates.map((row) => ({
      id: row.id,
      certificateNumber: row.certificate_number,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      status: row.status,
      sourceType: row.source_type,
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
    }));
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ic.status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN ic.status = 'revoked' THEN 1 ELSE 0 END) as revoked,
        COUNT(DISTINCT s.organization) as organizations,
        COUNT(DISTINCT COALESCE(ic.group_id, ic.group_code)) as groups,
        SUM(CASE WHEN ic.source_type = 'group_journal' THEN 1 ELSE 0 END) as from_journal,
        SUM(CASE WHEN ic.source_type = 'import' THEN 1 ELSE 0 END) as from_import,
        SUM(CASE WHEN ic.source_type = 'manual' THEN 1 ELSE 0 END) as from_manual
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
    `;
    const [stats] = await executeQuery(statsQuery);
    await logActivity(
      event,
      "VIEW",
      "ISSUED_CERTIFICATE",
      void 0,
      `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0431\u0430\u0437\u044B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 (\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ${params.page})`,
      { filters: { status: params.status, sourceType: params.sourceType, search: params.search, dateFrom: params.dateFrom, dateTo: params.dateTo } }
    );
    console.log(`[GET /api/certificates] \u041D\u0430\u0439\u0434\u0435\u043D\u043E ${total} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432, \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u043E ${items.length}`);
    return {
      success: true,
      data: {
        items,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit)
        },
        stats: {
          total: stats?.total || 0,
          issued: stats?.issued || 0,
          revoked: stats?.revoked || 0,
          organizations: stats?.organizations || 0,
          groups: stats?.groups || 0,
          fromJournal: stats?.from_journal || 0,
          fromImport: stats?.from_import || 0,
          fromManual: stats?.from_manual || 0
        }
      }
    };
  } catch (error) {
    console.error("[GET /api/certificates] Error:", error);
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432",
        data: error.errors
      });
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
