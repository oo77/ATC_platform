import { g as defineEventHandler, a4 as getRepresentativeStats } from '../../../_/nitro.mjs';
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

const stats_get = defineEventHandler(async (event) => {
  try {
    const stats = await getRepresentativeStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("Error fetching representative stats:", error);
    return {
      success: false,
      data: {
        total: 0,
        pending: 0,
        approved: 0,
        blocked: 0
      }
    };
  }
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
