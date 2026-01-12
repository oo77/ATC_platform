import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { l as updateAllSchedulePeriods } from '../../../_/scheduleRepository.mjs';
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

const index_put = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.periods || !Array.isArray(body.periods) || body.periods.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432 \u043F\u0435\u0440\u0438\u043E\u0434\u043E\u0432"
      });
    }
    for (const period of body.periods) {
      if (!period.periodNumber || typeof period.periodNumber !== "number") {
        throw createError({
          statusCode: 400,
          statusMessage: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u043F\u0430\u0440\u044B"
        });
      }
      if (!period.startTime || !/^\d{2}:\d{2}$/.test(period.startTime)) {
        throw createError({
          statusCode: 400,
          statusMessage: `\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0434\u043B\u044F \u043F\u0430\u0440\u044B ${period.periodNumber}`
        });
      }
      if (!period.endTime || !/^\d{2}:\d{2}$/.test(period.endTime)) {
        throw createError({
          statusCode: 400,
          statusMessage: `\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u043B\u044F \u043F\u0430\u0440\u044B ${period.periodNumber}`
        });
      }
    }
    const periods = await updateAllSchedulePeriods(body.periods);
    console.log(`[API] PUT /api/schedule/periods - \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${periods.length} \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0430\u0440`);
    return {
      success: true,
      periods,
      message: "\u0410\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043F\u0430\u0440\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B"
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0430\u0440:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0430\u0440"
    });
  }
});

export { index_put as default };
//# sourceMappingURL=index.put.mjs.map
