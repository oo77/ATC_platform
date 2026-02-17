import { g as defineEventHandler, j as getRouterParam, h as createError, M as getOrganizationById, f as executeQuery } from '../../../../_/nitro.mjs';
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

const courses_get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
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
    data: courses
  };
});

export { courses_get as default };
//# sourceMappingURL=courses.get.mjs.map
