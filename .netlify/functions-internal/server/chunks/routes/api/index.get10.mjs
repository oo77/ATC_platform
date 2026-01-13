import { d as defineEventHandler, g as getQuery, C as getOrganizationsPaginated, c as createError } from '../../nitro/nitro.mjs';
import { c as createActivityLog } from '../../_/activityLogRepository.mjs';
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
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      filters: {
        search: query.search,
        isActive: query.isActive !== void 0 ? query.isActive === "true" : void 0
      }
    };
    const result = await getOrganizationsPaginated(params);
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "VIEW",
      entityType: "ORGANIZATION",
      details: {
        page: params.page,
        limit: params.limit,
        filters: params.filters,
        resultCount: result.data.length
      }
    });
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get10.mjs.map
