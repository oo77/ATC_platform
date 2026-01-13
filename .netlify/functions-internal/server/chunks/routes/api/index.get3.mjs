import { d as defineEventHandler, g as getQuery, c as createError } from '../../nitro/nitro.mjs';
import { g as getClassrooms } from '../../_/scheduleRepository.mjs';
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
  try {
    const query = getQuery(event);
    const activeOnly = query.activeOnly !== "false";
    const classrooms = await getClassrooms(activeOnly);
    return {
      success: true,
      classrooms: classrooms.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }))
    };
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0439"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
