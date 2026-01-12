import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { n as updateScheduleSettings } from '../../../_/scheduleRepository.mjs';
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
    if (!body.settings || !Array.isArray(body.settings) || body.settings.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A"
      });
    }
    for (const setting of body.settings) {
      if (!setting.key || typeof setting.key !== "string") {
        throw createError({
          statusCode: 400,
          statusMessage: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438"
        });
      }
      if (setting.value === void 0 || setting.value === null) {
        throw createError({
          statusCode: 400,
          statusMessage: `\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 ${setting.key}`
        });
      }
    }
    const settings = await updateScheduleSettings(body.settings);
    console.log(`[API] PUT /api/schedule/settings - \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${settings.length} \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A`);
    return {
      success: true,
      settings,
      message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B"
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F"
    });
  }
});

export { index_put as default };
//# sourceMappingURL=index.put2.mjs.map
