import { d as defineEventHandler, a as getRouterParam, c as createError, g as getQuery } from '../../../../../nitro/nitro.mjs';
import { g as getInstructorById, c as checkInstructorHoursLimit } from '../../../../../_/instructorRepository.mjs';
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

const check_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const query = getQuery(event);
    const minutes = Number(query.minutes) || 0;
    if (minutes <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 minutes \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C"
      });
    }
    const instructor = await getInstructorById(id);
    if (!instructor) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const result = await checkInstructorHoursLimit(id, minutes);
    return {
      success: true,
      instructorName: instructor.fullName,
      maxHours: instructor.maxHours,
      ...result
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error checking instructor hours limit:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435 \u043B\u0438\u043C\u0438\u0442\u0430 \u0447\u0430\u0441\u043E\u0432"
    });
  }
});

export { check_get as default };
//# sourceMappingURL=check.get.mjs.map
