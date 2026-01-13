import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { b as getTemplateById } from '../../../../_/certificateTemplateRepository.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const template = await getTemplateById(id);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    console.log(`[GET /api/certificates/templates/${id}] \u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D \u0448\u0430\u0431\u043B\u043E\u043D: ${template.name}`);
    return {
      success: true,
      template
    };
  } catch (error) {
    console.error("[GET /api/certificates/templates/[id]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
