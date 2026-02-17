import { g as defineEventHandler, G as requireAuth, h as createError, j as getRouterParam } from '../../../../../_/nitro.mjs';
import { s as syncCertificateNumberCounter } from '../../../../../_/certificateTemplateRepository.mjs';
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
import '../../../../../_/academicHours.mjs';

const syncCounter_post = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D"
    });
  }
  const templateId = getRouterParam(event, "id");
  if (!templateId) {
    throw createError({
      statusCode: 400,
      message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
    });
  }
  try {
    const result = await syncCertificateNumberCounter(templateId);
    console.log(
      `[POST /api/certificates/templates/${templateId}/sync-counter] \u0421\u0447\u0435\u0442\u0447\u0438\u043A ${result.synced ? "\u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D" : "\u0430\u043A\u0442\u0443\u0430\u043B\u0435\u043D"}: ${result.oldCounter} -> ${result.newCounter}`
    );
    return {
      success: true,
      data: result,
      message: result.synced ? `\u0421\u0447\u0435\u0442\u0447\u0438\u043A \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D \u0441 ${result.oldCounter} \u043D\u0430 ${result.newCounter}` : `\u0421\u0447\u0435\u0442\u0447\u0438\u043A \u0430\u043A\u0442\u0443\u0430\u043B\u0435\u043D (${result.oldCounter})`
    };
  } catch (error) {
    console.error(
      `[POST /api/certificates/templates/${templateId}/sync-counter] \u041E\u0448\u0438\u0431\u043A\u0430:`,
      error
    );
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0441\u0447\u0435\u0442\u0447\u0438\u043A\u0430"
    });
  }
});

export { syncCounter_post as default };
//# sourceMappingURL=sync-counter.post.mjs.map
