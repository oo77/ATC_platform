import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { z } from 'zod';
import { o as createTemplate } from '../../../_/certificateTemplateRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const createTemplateSchema = z.object({
  name: z.string().min(1, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E").max(255),
  description: z.string().max(1e3).optional(),
  numberFormat: z.string().max(100).optional()
});
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validated = createTemplateSchema.parse(body);
    const template = await createTemplate({
      name: validated.name,
      description: validated.description,
      numberFormat: validated.numberFormat || "ATC{YY}_{CODE}_{NUM}"
    });
    await logActivity(
      event,
      "CREATE",
      "CERTIFICATE_TEMPLATE",
      template.id,
      template.name,
      { numberFormat: template.numberFormat }
    );
    console.log(`[POST /api/certificates/templates] \u0421\u043E\u0437\u0434\u0430\u043D \u0448\u0430\u0431\u043B\u043E\u043D: ${template.name}`);
    return {
      success: true,
      template,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D"
    };
  } catch (error) {
    console.error("[POST /api/certificates/templates] Error:", error);
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438",
        data: error.errors
      });
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
