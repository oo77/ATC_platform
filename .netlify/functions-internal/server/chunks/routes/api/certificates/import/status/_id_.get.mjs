import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../../nitro/nitro.mjs';
import { r as requireAuth, a as requireAnyPermission, P as Permission } from '../../../../../_/permissions.mjs';
import { g as getCertificateImportJobStatus } from '../../../../../_/certificateImportUtils.mjs';
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
import 'module';
import '../../../../../_/studentRepository.mjs';
import '../../../../../_/certificateTemplateRepository.mjs';
import '../../../../../_/courseRepository.mjs';

const _id__get = defineEventHandler(async (event) => {
  await requireAuth(event);
  await requireAnyPermission(event, [Permission.CERTIFICATES_ISSUE]);
  const jobId = getRouterParam(event, "id");
  if (!jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID \u0437\u0430\u0434\u0430\u0447\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
    });
  }
  const status = getCertificateImportJobStatus(jobId);
  if (!status) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u0438\u0441\u0442\u0435\u043A\u043B\u0430"
    });
  }
  const progress = status.totalRecords > 0 ? Math.round(status.processedRecords / status.totalRecords * 100) : 0;
  const duration = status.completedAt ? status.completedAt.getTime() - status.startedAt.getTime() : Date.now() - status.startedAt.getTime();
  return {
    success: true,
    status: {
      ...status,
      progress,
      duration
      // в миллисекундах
    }
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
