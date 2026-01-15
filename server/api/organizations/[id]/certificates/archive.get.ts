import { getOrganizationById } from "../../../../repositories/organizationRepository";
import { executeQuery } from "../../../../utils/db";
import { createCertificatesArchive } from "../../../../services/certificateArchiveService";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const courseId = query.courseId as string;
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID организации обязателен",
    });
  }

  const organization = await getOrganizationById(id);
  if (!organization) {
    throw createError({ statusCode: 404, message: "Организация не найдена" });
  }

  // Build query
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

  const params: any[] = [organization.name];

  if (courseId && courseId !== "all") {
    sql += ` AND c.id = ?`;
    params.push(courseId);
  }

  const groupId = query.groupId as string;
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

  const certificates = await executeQuery<any[]>(sql, params);

  if (certificates.length === 0) {
    throw createError({
      statusCode: 404,
      message: "Сертификаты не найдены по заданным критериям",
    });
  }

  // Set headers for download
  setHeader(event, "Content-Type", "application/zip");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename="certificates_${organization.code || id}_${
      startDate || "all"
    }.zip"`
  );

  try {
    return await createCertificatesArchive(certificates);
  } catch (error: any) {
    throw createError({ statusCode: 404, message: error.message });
  }
});
