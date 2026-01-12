import { d as defineEventHandler, G as getOrganizationsStats, c as createError } from '../../../nitro/nitro.mjs';
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

const stats_get = defineEventHandler(async (event) => {
  try {
    const stats = await getOrganizationsStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("Error fetching organizations stats:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439"
    });
  }
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
