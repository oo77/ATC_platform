import { g as defineEventHandler, h as createError } from '../../../_/nitro.mjs';
import { a as getStudentCourses } from '../../../_/studentCourseRepository.mjs';
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

const myCourses_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  console.log("[API] GET /api/students/my-courses - User:", user?.id);
  if (!user) {
    console.error(
      "[API] Unauthorized access attempt to /api/students/my-courses"
    );
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  try {
    const courses = await getStudentCourses(user.id);
    console.log(
      `[API] Successfully retrieved ${courses.length} courses for user ${user.id}`
    );
    return courses;
  } catch (error) {
    console.error("[API] Failed to get student courses:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve courses"
    });
  }
});

export { myCourses_get as default };
//# sourceMappingURL=my-courses.get.mjs.map
