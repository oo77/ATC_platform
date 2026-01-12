import { d as defineEventHandler, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { n as getTemplates } from '../../../_/certificateTemplateRepository.mjs';
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
    const isActive = query.isActive !== void 0 ? query.isActive === "true" : void 0;
    const templates = await getTemplates({ isActive });
    console.log(`[GET /api/certificates/templates] \u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E ${templates.length} \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432`);
    return {
      success: true,
      templates,
      total: templates.length
    };
  } catch (error) {
    console.error("[GET /api/certificates/templates] Error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
