import { d as defineEventHandler, g as getQuery, E as searchOrganizations, F as getAllOrganizations, c as createError } from '../../../nitro/nitro.mjs';
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

const search_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const searchQuery = query.q;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    let organizations;
    if (searchQuery && searchQuery.trim()) {
      organizations = await searchOrganizations(searchQuery.trim(), limit);
    } else {
      const all = await getAllOrganizations();
      organizations = all.slice(0, limit);
    }
    return {
      success: true,
      data: organizations
    };
  } catch (error) {
    console.error("Error searching organizations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u0438\u0441\u043A\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439"
    });
  }
});

export { search_get as default };
//# sourceMappingURL=search.get.mjs.map
