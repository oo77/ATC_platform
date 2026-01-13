import { d as defineEventHandler, g as getQuery, O as getRepresentativesPaginated, c as createError } from '../../nitro/nitro.mjs';
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
      status: query.status,
      organizationId: query.organizationId,
      search: query.search
    };
    const result = await getRepresentativesPaginated(params);
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "VIEW",
      entityType: "REPRESENTATIVE",
      details: {
        page: params.page,
        limit: params.limit,
        filters: { status: params.status, organizationId: params.organizationId },
        resultCount: result.data.length
      }
    });
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error("Error fetching representatives:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get12.mjs.map
