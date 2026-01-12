import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { f as getStudentsPaginated } from '../../_/studentRepository.mjs';
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
    const params = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10,
      search: query.search,
      fullName: query.fullName,
      pinfl: query.pinfl,
      organization: query.organization,
      position: query.position,
      hasCertificates: query.hasCertificates === "true",
      noCertificates: query.noCertificates === "true"
    };
    if (params.limit && params.limit > 100) {
      params.limit = 100;
    }
    const result = await getStudentsPaginated(params);
    return {
      success: true,
      students: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432",
      students: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get14.mjs.map
