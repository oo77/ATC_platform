import { d as defineEventHandler, c as createError, g as getQuery } from '../../nitro/nitro.mjs';
import { g as getActivityLogsPaginated } from '../../_/activityLogRepository.mjs';
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
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    if (user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"
      });
    }
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const userId = query.userId;
    const actionType = query.actionType;
    const entityType = query.entityType;
    const startDate = query.startDate;
    const endDate = query.endDate;
    const result = await getActivityLogsPaginated({
      page,
      limit,
      userId,
      actionType,
      entityType,
      startDate,
      endDate
    });
    return {
      success: true,
      ...result
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0436\u0443\u0440\u043D\u0430\u043B\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0436\u0443\u0440\u043D\u0430\u043B\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
