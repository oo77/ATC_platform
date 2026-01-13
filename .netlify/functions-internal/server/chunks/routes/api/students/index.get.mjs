import { d as defineEventHandler, c as createError } from '../../../_/nitro.mjs';
import { b as getStudentCourses } from '../../../_/studentCourseRepository.mjs';
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
import 'jsonwebtoken';

const index_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const courses = await getStudentCourses(user.id);
    return courses;
  } catch (error) {
    console.error("Failed to get student courses:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve courses"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
