import { g as defineEventHandler, j as getRouterParam, i as getQuery, h as createError, M as getOrganizationById, f as executeQuery, F as setHeader } from '../../../../../_/nitro.mjs';
import { createCertificatesArchive } from '../../../../../_/certificateArchiveService.mjs';
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
import 'archiver';
import 'fs';
import 'path';

const archive_get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const courseId = query.courseId;
  const startDate = query.startDate;
  const endDate = query.endDate;
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  const organization = await getOrganizationById(id);
  if (!organization) {
    throw createError({ statusCode: 404, message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
  }
  let sql = `
    SELECT 
      ic.id,
      ic.certificate_number,
      ic.pdf_file_url,
      ic.docx_file_url,
      ic.issue_date,
      s.full_name as student_name,
      c.name as course_name
    FROM issued_certificates ic
    JOIN students s ON ic.student_id = s.id
    JOIN study_groups g ON ic.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.organization = ?
      AND ic.status = 'issued'
  `;
  const params = [organization.name];
  if (courseId && courseId !== "all") {
    sql += ` AND c.id = ?`;
    params.push(courseId);
  }
  const groupId = query.groupId;
  if (groupId && groupId !== "all") {
    sql += ` AND g.id = ?`;
    params.push(groupId);
  }
  if (startDate) {
    sql += ` AND ic.issue_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND ic.issue_date <= ?`;
    params.push(endDate);
  }
  sql += ` ORDER BY ic.issue_date DESC`;
  const certificates = await executeQuery(sql, params);
  if (certificates.length === 0) {
    throw createError({
      statusCode: 404,
      message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u043F\u043E \u0437\u0430\u0434\u0430\u043D\u043D\u044B\u043C \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u044F\u043C"
    });
  }
  setHeader(event, "Content-Type", "application/zip");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="certificates_${organization.code || id}_${startDate || "all"}.zip"`
  );
  try {
    return await createCertificatesArchive(certificates);
  } catch (error) {
    throw createError({ statusCode: 404, message: error.message });
  }
});

export { archive_get as default };
//# sourceMappingURL=archive.get.mjs.map
