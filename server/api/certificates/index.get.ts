/**
 * GET /api/certificates
 * Получить все выданные сертификаты с фильтрацией и пагинацией
 * Поддерживает как сертификаты из журнала группы, так и standalone (import/manual)
 */

import { z } from 'zod';
import { executeQuery } from '../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';
import { logActivity } from '../../utils/activityLogger';

const querySchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  search: z.string().optional(),
  status: z.enum(['issued', 'revoked', 'all']).optional().default('all'),
  sourceType: z.enum(['group_journal', 'manual', 'import', 'all']).optional().default('all'),
  groupId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  organizationName: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['issue_date', 'student_name', 'certificate_number', 'course_name']).optional().default('issue_date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

interface CertificateRow extends RowDataPacket {
  id: string;
  certificate_number: string;
  issue_date: Date;
  expiry_date: Date | null;
  status: string;
  source_type: 'group_journal' | 'manual' | 'import';
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

interface CountRow extends RowDataPacket {
  total: number;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = querySchema.parse(query);

    // Формируем базовый запрос с LEFT JOIN для поддержки standalone сертификатов
    let baseQuery = `
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      LEFT JOIN study_groups g ON ic.group_id = g.id
      LEFT JOIN courses c ON g.course_id = c.id
      LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
      LEFT JOIN users u ON ic.issued_by = u.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    // Фильтр по статусу
    if (params.status && params.status !== 'all') {
      baseQuery += ' AND ic.status = ?';
      queryParams.push(params.status);
    }

    // Фильтр по типу источника
    if (params.sourceType && params.sourceType !== 'all') {
      baseQuery += ' AND ic.source_type = ?';
      queryParams.push(params.sourceType);
    }

    // Поиск
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

    // Фильтр по группе
    if (params.groupId) {
      baseQuery += ' AND ic.group_id = ?';
      queryParams.push(params.groupId);
    }

    // Фильтр по шаблону
    if (params.templateId) {
      baseQuery += ' AND ic.template_id = ?';
      queryParams.push(params.templateId);
    }

    // Фильтр по организации
    if (params.organizationName) {
      baseQuery += ' AND s.organization LIKE ?';
      queryParams.push(`%${params.organizationName}%`);
    }

    // Фильтр по дате выдачи
    if (params.dateFrom) {
      baseQuery += ' AND DATE(ic.issue_date) >= ?';
      queryParams.push(params.dateFrom);
    }

    if (params.dateTo) {
      baseQuery += ' AND DATE(ic.issue_date) <= ?';
      queryParams.push(params.dateTo);
    }

    // Получаем общее количество записей
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await executeQuery<CountRow[]>(countQuery, queryParams);
    const total = countResult?.total || 0;

    // Формируем сортировку (с учётом standalone полей)
    let orderBy = 'ic.issue_date';
    switch (params.sortBy) {
      case 'student_name':
        orderBy = 's.full_name';
        break;
      case 'certificate_number':
        orderBy = 'ic.certificate_number';
        break;
      case 'course_name':
        orderBy = 'COALESCE(c.name, ic.course_name)';
        break;
    }

    // Формируем основной запрос с данными
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
    const certificates = await executeQuery<CertificateRow[]>(selectQuery, dataParams);

    // Преобразуем в удобный формат (приоритет: данные из связей > standalone данные)
    const items = certificates.map(row => ({
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
        pinfl: row.student_pinfl,
      },
      group: {
        id: row.group_id,
        code: row.group_code || row.standalone_group_code || null,
        startDate: row.standalone_group_start_date,
        endDate: row.standalone_group_end_date,
      },
      course: {
        name: row.course_name || row.standalone_course_name || 'Не указан',
        code: row.course_code || row.standalone_course_code || null,
        hours: row.standalone_course_hours,
      },
      template: row.template_id ? {
        id: row.template_id,
        name: row.template_name,
      } : null,
      issuedBy: row.issued_by ? {
        id: row.issued_by,
        name: row.issued_by_name,
      } : null,
      issuedAt: row.issued_at,
      revokedAt: row.revoked_at,
      revokeReason: row.revoke_reason,
      hasWarnings: Boolean(row.has_warnings),
      notes: row.notes,
      createdAt: row.created_at,
    }));

    // Получаем статистику (с учётом всех сертификатов)
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
    const [stats] = await executeQuery<any[]>(statsQuery);

    // Логируем просмотр
    await logActivity(
      event,
      'VIEW',
      'ISSUED_CERTIFICATE',
      undefined,
      `Просмотр базы сертификатов (страница ${params.page})`,
      { filters: { status: params.status, sourceType: params.sourceType, search: params.search, dateFrom: params.dateFrom, dateTo: params.dateTo } }
    );

    console.log(`[GET /api/certificates] Найдено ${total} сертификатов, отображено ${items.length}`);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
        stats: {
          total: stats?.total || 0,
          issued: stats?.issued || 0,
          revoked: stats?.revoked || 0,
          organizations: stats?.organizations || 0,
          groups: stats?.groups || 0,
          fromJournal: stats?.from_journal || 0,
          fromImport: stats?.from_import || 0,
          fromManual: stats?.from_manual || 0,
        },
      },
    };
  } catch (error: any) {
    console.error('[GET /api/certificates] Error:', error);

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации параметров',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка получения списка сертификатов',
    });
  }
});
