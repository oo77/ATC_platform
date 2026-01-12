import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
import { b as getQuestionBanks } from '../../../_/questionBankRepository.mjs';
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
    const filters = {
      search: query.search,
      category: query.category,
      is_active: query.is_active !== void 0 ? query.is_active === "true" : void 0
    };
    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: Math.min(query.limit ? parseInt(query.limit, 10) : 20, 100)
    };
    const result = await getQuestionBanks(filters, pagination);
    return {
      success: true,
      banks: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0431\u0430\u043D\u043A\u043E\u0432 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0431\u0430\u043D\u043A\u043E\u0432 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432",
      banks: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
