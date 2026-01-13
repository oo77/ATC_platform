import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { b as getTemplateById, l as deleteTemplate } from '../../../../_/certificateTemplateRepository.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
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
import '../../../../_/activityLogRepository.mjs';

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const existing = await getTemplateById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const deleted = await deleteTemplate(id);
    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D"
      });
    }
    await logActivity(
      event,
      "DELETE",
      "CERTIFICATE_TEMPLATE",
      id,
      existing.name
    );
    console.log(`[DELETE /api/certificates/templates/${id}] \u0423\u0434\u0430\u043B\u0451\u043D \u0448\u0430\u0431\u043B\u043E\u043D: ${existing.name}`);
    return {
      success: true,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0451\u043D"
    };
  } catch (error) {
    console.error("[DELETE /api/certificates/templates/[id]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
