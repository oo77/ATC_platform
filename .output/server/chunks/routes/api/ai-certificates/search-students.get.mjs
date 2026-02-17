import { g as defineEventHandler, i as getQuery, h as createError } from '../../../_/nitro.mjs';
import { a as getStudentsPaginated } from '../../../_/studentRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../_/permissions.mjs';
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

const searchStudents_get = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const query = getQuery(event);
  const search = query.search || query.q;
  if (!search || search.length < 2) {
    return [];
  }
  try {
    const result = await getStudentsPaginated({
      search,
      page: 1,
      limit: 20
    });
    return result.data.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      pinfl: s.pinfl,
      organization: s.organization,
      position: s.position
    }));
  } catch (error) {
    console.error("Student search error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to search students"
    });
  }
});

export { searchStudents_get as default };
//# sourceMappingURL=search-students.get.mjs.map
