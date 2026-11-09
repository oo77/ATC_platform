/**
 * GET /api/certificates/archive-options
 * Справочник курсов и групп, встречающихся среди выданных сертификатов —
 * для окна настройки выгрузки архива (выбор курса/группы на странице «Сертификаты»)
 */

import { executeQuery } from "../../utils/db";
import { Permission, requirePermission } from "../../utils/permissions";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа — те же, что у списка и архива сертификатов
  await requirePermission(event, Permission.CERTIFICATES_VIEW_ALL);

  const courseRows = await executeQuery<any[]>(
    `SELECT DISTINCT COALESCE(c.name, ic.course_name) AS name
     FROM issued_certificates ic
     LEFT JOIN study_groups g ON ic.group_id = g.id
     LEFT JOIN courses c ON g.course_id = c.id
     WHERE COALESCE(c.name, ic.course_name) IS NOT NULL
       AND COALESCE(c.name, ic.course_name) != ''
     ORDER BY name`,
  );

  const groupRows = await executeQuery<any[]>(
    `SELECT DISTINCT
       COALESCE(g.code, ic.group_code) AS code,
       COALESCE(c.name, ic.course_name) AS course_name
     FROM issued_certificates ic
     LEFT JOIN study_groups g ON ic.group_id = g.id
     LEFT JOIN courses c ON g.course_id = c.id
     WHERE COALESCE(g.code, ic.group_code) IS NOT NULL
       AND COALESCE(g.code, ic.group_code) != ''
     ORDER BY code`,
  );

  return {
    success: true,
    courses: courseRows.map((row) => row.name).filter(Boolean),
    groups: groupRows
      .map((row) => ({ code: row.code as string, courseName: (row.course_name as string) || null }))
      .filter((g) => Boolean(g.code)),
  };
});
