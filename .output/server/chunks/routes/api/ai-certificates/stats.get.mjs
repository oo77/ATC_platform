import { g as defineEventHandler, h as createError } from '../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../_/aiCertificateRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../_/permissions.mjs';
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
  await requirePermission(event, Permission.CERTIFICATES_VIEW);
  try {
    const stats = await aiCertificateRepository.getStats();
    return stats;
  } catch (error) {
    console.error("Fetch stats error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch stats"
    });
  }
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
