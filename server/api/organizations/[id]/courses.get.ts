import { getOrganizationById } from "../../../repositories/organizationRepository";
import { executeQuery } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

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

  // Get distinct courses that have ISSUED certificates for this organization
  // This ensures we only show courses that actually have something to download
  const sql = `
    SELECT DISTINCT c.id, c.name, c.code
    FROM issued_certificates ic
    JOIN students s ON ic.student_id = s.id
    JOIN study_groups g ON ic.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE (s.organization = ? OR s.organization = ?)
      AND ic.status = 'issued'
    ORDER BY c.name ASC
  `;

  const courses = await executeQuery(sql, [organization.name, organization.id]);

  return {
    success: true,
    data: courses,
  };
});
