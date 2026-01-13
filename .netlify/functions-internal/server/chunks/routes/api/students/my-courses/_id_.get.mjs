import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../../_/nitro.mjs';
import { a as getStudentCourseDetails } from '../../../../_/studentCourseRepository.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const user = event.context.user;
  const groupId = getRouterParam(event, "id");
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }
  if (!groupId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Group ID is required"
    });
  }
  try {
    const details = await getStudentCourseDetails(user.id, groupId);
    if (!details) {
      throw createError({
        statusCode: 404,
        statusMessage: "Course not found"
      });
    }
    return details;
  } catch (error) {
    console.error("Failed to get student course details:", error);
    if (error.statusCode === 404) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve course details"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
