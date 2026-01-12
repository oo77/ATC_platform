import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
import { b as getTestTemplates } from '../../../_/testTemplateRepository.mjs';
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
import '../../../_/questionRepository.mjs';

const index_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const filters = {
      bank_id: query.bank_id,
      is_active: query.is_active !== void 0 ? query.is_active === "true" : void 0,
      search: query.search
    };
    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: Math.min(query.limit ? parseInt(query.limit, 10) : 20, 100)
    };
    const result = await getTestTemplates(filters, pagination);
    return {
      success: true,
      templates: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u0442\u0435\u0441\u0442\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432",
      templates: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
