import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import { k as getSchedulePeriods, m as getScheduleSettingsAsObject } from '../../../_/scheduleRepository.mjs';
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
    const [periods, settings] = await Promise.all([
      getSchedulePeriods(),
      getScheduleSettingsAsObject()
    ]);
    console.log(`[API] GET /api/schedule/settings - \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u044B \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F`);
    return {
      success: true,
      periods,
      settings
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
