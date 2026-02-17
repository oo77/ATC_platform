import { g as defineEventHandler, j as getRouterParam, i as getQuery, h as createError, M as getOrganizationById, f as executeQuery } from '../../../../_/nitro.mjs';
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

const groups_get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const courseId = query.courseId;
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
    SELECT DISTINCT g.id, g.code as name, g.start_date, g.end_date
    FROM issued_certificates ic
    JOIN students s ON ic.student_id = s.id
    JOIN study_groups g ON ic.group_id = g.id
    WHERE (s.organization = ? OR s.organization = ?)
      AND ic.status = 'issued'
  `;
  const params = [organization.name, organization.id];
  if (courseId && courseId !== "all") {
    sql += ` AND g.course_id = ?`;
    params.push(courseId);
  }
  sql += ` ORDER BY g.start_date DESC`;
  const groups = await executeQuery(sql, params);
  return {
    success: true,
    data: groups
  };
});

export { groups_get as default };
//# sourceMappingURL=groups.get.mjs.map
