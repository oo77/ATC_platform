import { g as defineEventHandler, i as getQuery, h as createError } from '../../../_/nitro.mjs';
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

const logs_get = defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_VIEW);
  const query = getQuery(event);
  const filters = {
    page: query.page ? parseInt(query.page) : 1,
    limit: query.limit ? parseInt(query.limit) : 20,
    status: query.status,
    processedBy: query.userId,
    // userId в query может фильтровать по админу
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  };
  try {
    const result = await aiCertificateRepository.getLogs(filters);
    return result;
  } catch (error) {
    console.error("Fetch logs error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch logs"
    });
  }
});

export { logs_get as default };
//# sourceMappingURL=logs.get.mjs.map
