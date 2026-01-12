import { d as defineEventHandler, a as getRouterParam, c as createError, H as getRepresentativeById, g as getQuery } from '../../../../nitro/nitro.mjs';
import { getBotRequestHistory, getBotRequestStats } from '../../../../_/botLogger.mjs';
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

const requests_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const representative = await getRepresentativeById(id);
    if (!representative) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const query = getQuery(event);
    const limit = parseInt(query.limit) || 50;
    const offset = parseInt(query.offset) || 0;
    const [history, stats] = await Promise.all([
      getBotRequestHistory(id, limit, offset),
      getBotRequestStats(id)
    ]);
    return {
      success: true,
      data: {
        history,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.total
        }
      }
    };
  } catch (error) {
    console.error("[API] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432"
    });
  }
});

export { requests_get as default };
//# sourceMappingURL=requests.get.mjs.map
