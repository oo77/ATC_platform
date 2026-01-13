import { d as defineEventHandler, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { k as getSchedulePeriods } from '../../../_/scheduleRepository.mjs';
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
    const periods = await getSchedulePeriods(activeOnly);
    console.log(`[API] GET /api/schedule/periods - \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${periods.length} \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0430\u0440`);
    return {
      success: true,
      periods
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0430\u0440:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0430\u0440"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
