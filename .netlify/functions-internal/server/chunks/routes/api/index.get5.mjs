import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { a as getDisciplineTests } from '../../_/disciplineTestRepository.mjs';
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
    const disciplineId = query.discipline_id;
    console.log("[API discipline-tests] \u0417\u0430\u043F\u0440\u043E\u0441 \u0441 discipline_id:", disciplineId);
    if (!disciplineId) {
      return {
        success: false,
        message: "ID \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D",
        tests: []
      };
    }
    const tests = await getDisciplineTests(disciplineId);
    console.log("[API discipline-tests] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0442\u0435\u0441\u0442\u043E\u0432:", tests.length, "\u0434\u043B\u044F discipline_id:", disciplineId);
    return {
      success: true,
      tests
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0442\u0435\u0441\u0442\u043E\u0432 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B",
      tests: []
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get5.mjs.map
