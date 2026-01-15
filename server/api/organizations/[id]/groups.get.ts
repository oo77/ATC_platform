import { getOrganizationById } from "../../../repositories/organizationRepository";
import { executeQuery } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const courseId = query.courseId as string;

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

  // Initial SQL to get groups with issued certificates for this organization
  let sql = `
    SELECT DISTINCT g.id, g.code as name, g.start_date, g.end_date
    FROM issued_certificates ic
    JOIN students s ON ic.student_id = s.id
    JOIN study_groups g ON ic.group_id = g.id
    WHERE (s.organization = ? OR s.organization = ?)
      AND ic.status = 'issued'
  `;

  const params: any[] = [organization.name, organization.id];

  if (courseId && courseId !== "all") {
    sql += ` AND g.course_id = ?`;
    params.push(courseId);
  }

  sql += ` ORDER BY g.start_date DESC`;

  const groups = await executeQuery(sql, params);

  return {
    success: true,
    data: groups,
  };
});
