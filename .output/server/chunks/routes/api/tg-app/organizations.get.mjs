import { g as defineEventHandler, i as getQuery, Q as getOrganizationsPaginated, h as createError } from '../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const organizations_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit, 10) : 1e3;
    const search = query.search;
    const result = await getOrganizationsPaginated({
      page: 1,
      limit,
      filters: {
        isActive: true,
        search
      }
    });
    return {
      success: true,
      data: result.data.map((org) => ({
        id: org.id,
        name: org.name
      }))
    };
  } catch (error) {
    console.error("[TG-App] Error fetching organizations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439"
    });
  }
});

export { organizations_get as default };
//# sourceMappingURL=organizations.get.mjs.map
