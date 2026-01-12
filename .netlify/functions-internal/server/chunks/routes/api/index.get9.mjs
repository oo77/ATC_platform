import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { e as getInstructorsPaginated } from '../../_/instructorRepository.mjs';
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
    const filters = {};
    if (query.search) {
      filters.search = query.search;
    }
    if (query.isActive !== void 0) {
      filters.isActive = query.isActive === "true";
    }
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? Math.min(parseInt(query.limit, 10), 100) : 10;
    const result = await getInstructorsPaginated({ page, limit, filters });
    return {
      success: true,
      instructors: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432",
      instructors: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get9.mjs.map
