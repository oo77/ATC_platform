import { g as defineEventHandler, j as getRouterParam, h as createError, f as executeQuery } from '../../../../../_/nitro.mjs';
import { g as getGroupById } from '../../../../../_/groupRepository.mjs';
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

const instructors_get = defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, "groupId");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const group = await getGroupById(groupId);
    if (!group) {
      throw createError({
        statusCode: 404,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (!group.course?.id) {
      throw createError({
        statusCode: 400,
        message: "\u041A\u0443\u0440\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0434\u043B\u044F \u0433\u0440\u0443\u043F\u043F\u044B"
      });
    }
    const instructorRows = await executeQuery(
      `SELECT DISTINCT 
        i.id,
        i.full_name,
        i.email,
        CASE WHEN di.is_primary = 1 THEN true ELSE false END as is_primary
      FROM discipline_instructors di
      JOIN instructors i ON di.instructor_id = i.id
      JOIN disciplines d ON di.discipline_id = d.id
      WHERE d.course_id = ? AND i.is_active = true
      ORDER BY di.is_primary DESC, i.full_name`,
      [group.course.id]
    );
    const instructors = instructorRows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      position: null,
      // Position column doesn't exist in instructors table
      email: row.email,
      isPrimary: Boolean(row.is_primary)
    }));
    const defaultInstructorId = instructors.find((i) => i.isPrimary)?.id || (instructors.length > 0 ? instructors[0].id : null);
    console.log(
      `[GET /api/certificates/issue/${groupId}/instructors] \u041D\u0430\u0439\u0434\u0435\u043D\u043E ${instructors.length} \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432, default: ${defaultInstructorId}`
    );
    return {
      success: true,
      instructors,
      defaultInstructorId
    };
  } catch (error) {
    console.error(
      "[GET /api/certificates/issue/[groupId]/instructors] Error:",
      error
    );
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432"
    });
  }
});

export { instructors_get as default };
//# sourceMappingURL=instructors.get.mjs.map
