import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { b as getTemplateById, m as updateTemplate } from '../../../../_/certificateTemplateRepository.mjs';
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

const variableMappingSchema = z.object({
  placeholder: z.string(),
  source: z.string(),
  customValue: z.string().optional(),
  dateFormat: z.string().optional()
});
const qrSettingsSchema = z.object({
  enabled: z.boolean(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(50).max(500),
  color: z.string().optional(),
  backgroundColor: z.string().optional()
});
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1e3).nullable().optional(),
  variables: z.array(variableMappingSchema).optional(),
  qrSettings: qrSettingsSchema.optional(),
  numberFormat: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  // Поля визуального редактора
  templateData: z.any().optional(),
  // JSON структура шаблона
  layout: z.string().optional(),
  backgroundUrl: z.string().nullable().optional()
});
const _id__put = defineEventHandler(async (event) => {
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
    const body = await readBody(event);
    const validated = updateTemplateSchema.parse(body);
    const template = await updateTemplate(id, validated);
    await logActivity(
      event,
      "UPDATE",
      "CERTIFICATE_TEMPLATE",
      id,
      template?.name || existing.name,
      { updatedFields: Object.keys(validated) }
    );
    console.log(`[PUT /api/certificates/templates/${id}] \u041E\u0431\u043D\u043E\u0432\u043B\u0451\u043D \u0448\u0430\u0431\u043B\u043E\u043D: ${template?.name}`);
    return {
      success: true,
      template,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D"
    };
  } catch (error) {
    console.error("[PUT /api/certificates/templates/[id]] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438",
        data: error.errors
      });
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
