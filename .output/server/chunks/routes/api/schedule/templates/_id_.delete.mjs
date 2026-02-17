import { g as defineEventHandler, h as createError, j as getRouterParam, f as executeQuery } from '../../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../../_/activityLogRepository.mjs';

const _id__delete = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "\u0422\u043E\u043B\u044C\u043A\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u0443\u0434\u0430\u043B\u044F\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u044B"
    });
  }
  const templateId = getRouterParam(event, "id");
  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  console.log(
    `[templates.delete] User ${user.id} deleting template ${templateId}`
  );
  try {
    const templateQuery = `SELECT id, name FROM schedule_templates WHERE id = ?`;
    const templates = await executeQuery(templateQuery, [
      templateId
    ]);
    if (templates.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const template = templates[0];
    await executeQuery(
      `UPDATE schedule_templates SET is_active = FALSE WHERE id = ?`,
      [templateId]
    );
    await logActivity(
      event,
      "DELETE",
      "SCHEDULE",
      templateId,
      `\u0428\u0430\u0431\u043B\u043E\u043D \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F: ${template.name}`,
      {
        templateId,
        templateName: template.name
      }
    );
    console.log(`[templates.delete] Deleted template ${templateId}`);
    return {
      success: true,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0451\u043D"
    };
  } catch (error) {
    console.error("[templates.delete] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
