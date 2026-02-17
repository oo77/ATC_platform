import { g as defineEventHandler, i as getQuery, h as createError, f as executeQuery } from '../../../_/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { organizationId, mode = "all", search } = query;
  console.log(
    `[TG-App] GET /api/tg-app/students - mode: ${mode}, orgId: ${organizationId}`
  );
  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  try {
    if (mode === "all") {
      let sql = `
        SELECT 
          s.id,
          s.full_name as fullName,
          s.pinfl,
          s.position,
          s.department,
          COUNT(DISTINCT ic.id) as certificatesCount,
          MAX(ic.issue_date) as lastCertificateDate
        FROM students s
        LEFT JOIN issued_certificates ic ON s.id = ic.student_id AND ic.status = 'issued'
        WHERE s.organization_id = ?
      `;
      const params = [organizationId];
      if (search && typeof search === "string" && search.trim()) {
        sql += ` AND (s.full_name LIKE ? OR s.pinfl LIKE ?)`;
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern);
      }
      sql += `
        GROUP BY s.id, s.full_name, s.pinfl, s.position, s.department
        ORDER BY s.full_name ASC
      `;
      const students = await executeQuery(sql, params);
      console.log(`[TG-App] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 (all): ${students.length}`);
      const formattedStudents = students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        pinfl: s.pinfl ? `***${s.pinfl.slice(-4)}` : null,
        // Маскируем ПИНФЛ
        position: s.position || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430",
        department: s.department || null,
        certificatesCount: Number(s.certificatesCount) || 0,
        lastCertificateDate: s.lastCertificateDate ? new Date(s.lastCertificateDate).toLocaleDateString("ru-RU") : null
      }));
      return {
        success: true,
        mode: "all",
        students: formattedStudents,
        total: formattedStudents.length
      };
    } else {
      let sql = `
        SELECT 
          s.id,
          s.full_name as fullName,
          g.code as groupName,
          c.name as courseName,
          g.start_date as startDate,
          g.end_date as endDate
        FROM students s
        INNER JOIN study_group_students sgs ON s.id = sgs.student_id
        INNER JOIN study_groups g ON sgs.group_id = g.id
        INNER JOIN courses c ON g.course_id = c.id
        WHERE s.organization_id = ? 
          AND g.is_active = TRUE
      `;
      const params = [organizationId];
      if (search && typeof search === "string" && search.trim()) {
        sql += ` AND s.full_name LIKE ?`;
        params.push(`%${search.trim()}%`);
      }
      sql += ` ORDER BY g.start_date DESC, s.full_name ASC`;
      const students = await executeQuery(sql, params);
      console.log(`[TG-App] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 (groups): ${students.length}`);
      const formattedStudents = students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        groupName: s.groupName,
        courseName: s.courseName,
        startDate: s.startDate ? new Date(s.startDate).toLocaleDateString("ru-RU") : "",
        endDate: s.endDate ? new Date(s.endDate).toLocaleDateString("ru-RU") : ""
      }));
      return {
        success: true,
        mode: "groups",
        students: formattedStudents,
        total: formattedStudents.length
      };
    }
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
