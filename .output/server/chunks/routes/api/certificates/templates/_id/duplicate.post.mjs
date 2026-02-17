import { g as defineEventHandler, j as getRouterParam, h as createError } from '../../../../../_/nitro.mjs';
import { b as getTemplateById, n as createTemplate, m as updateTemplate } from '../../../../../_/certificateTemplateRepository.mjs';
import { l as logActivity } from '../../../../../_/activityLogger.mjs';
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
import '../../../../../_/activityLogRepository.mjs';

const duplicate_post = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const original = await getTemplateById(id);
    if (!original) {
      throw createError({
        statusCode: 404,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const duplicatedTemplate = await createTemplate({
      name: `${original.name} (\u043A\u043E\u043F\u0438\u044F)`,
      description: original.description ? `${original.description} (\u043A\u043E\u043F\u0438\u044F)` : void 0,
      numberFormat: original.numberFormat
    });
    const updatedTemplate = await updateTemplate(duplicatedTemplate.id, {
      templateData: original.templateData ?? void 0,
      layout: original.layout ?? void 0,
      backgroundUrl: original.backgroundUrl ?? void 0,
      variables: original.variables ?? void 0,
      qrSettings: original.qrSettings ?? void 0,
      isActive: false
      // Новый шаблон по умолчанию неактивен
    });
    await logActivity(
      event,
      "CREATE",
      "CERTIFICATE_TEMPLATE",
      duplicatedTemplate.id,
      duplicatedTemplate.name,
      {
        action: "duplicate",
        originalTemplateId: id,
        originalTemplateName: original.name
      }
    );
    console.log(
      `[POST /api/certificates/templates/${id}/duplicate] \u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u043A\u043E\u043F\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430: ${duplicatedTemplate.name} (ID: ${duplicatedTemplate.id})`
    );
    return {
      success: true,
      template: updatedTemplate || duplicatedTemplate,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D"
    };
  } catch (error) {
    console.error(
      "[POST /api/certificates/templates/[id]/duplicate] Error:",
      error
    );
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { duplicate_post as default };
//# sourceMappingURL=duplicate.post.mjs.map
