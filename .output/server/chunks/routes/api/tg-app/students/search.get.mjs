import { g as defineEventHandler, i as getQuery, h as createError, f as executeQuery } from '../../../../_/nitro.mjs';
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

const search_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { organizationId, q, limit = 5 } = query;
  console.log(
    `[TG-App] GET /api/tg-app/students/search - q: "${q}", orgId: ${organizationId}`
  );
  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return {
      success: true,
      students: [],
      message: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043C\u0438\u043D\u0438\u043C\u0443\u043C 2 \u0441\u0438\u043C\u0432\u043E\u043B\u0430 \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430"
    };
  }
  try {
    const searchTerm = q.trim();
    const searchPattern = `%${searchTerm}%`;
    const maxResults = Math.min(Number(limit) || 5, 10);
    const students = await executeQuery(
      `SELECT 
        s.id,
        s.full_name as fullName,
        s.pinfl,
        s.position,
        s.department,
        (SELECT COUNT(*) FROM issued_certificates ic WHERE ic.student_id = s.id AND ic.status = 'issued') as certificatesCount
      FROM students s
      WHERE s.organization_id = ?
        AND (s.full_name LIKE ? OR s.pinfl LIKE ?)
      ORDER BY 
        CASE 
          WHEN s.full_name LIKE ? THEN 1  -- \u0422\u043E\u0447\u043D\u043E\u0435 \u043D\u0430\u0447\u0430\u043B\u043E \u0438\u043C\u0435\u043D\u0438
          WHEN s.full_name LIKE ? THEN 2  -- \u0421\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0432 \u0438\u043C\u0435\u043D\u0438
          ELSE 3
        END,
        s.full_name ASC
      LIMIT ?`,
      [
        organizationId,
        searchPattern,
        searchPattern,
        `${searchTerm}%`,
        // Начинается с
        searchPattern,
        // Содержит
        maxResults
      ]
    );
    console.log(`[TG-App] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439: ${students.length}`);
    const formattedStudents = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      pinfl: s.pinfl,
      pinflMasked: s.pinfl ? `***${s.pinfl.slice(-4)}` : null,
      position: s.position || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430",
      department: s.department || null,
      certificatesCount: Number(s.certificatesCount) || 0
    }));
    return {
      success: true,
      students: formattedStudents,
      total: formattedStudents.length
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0438\u0441\u043A\u0430 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { search_get as default };
//# sourceMappingURL=search.get.mjs.map
