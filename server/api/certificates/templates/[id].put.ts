/**
 * PUT /api/certificates/templates/[id]
 * Обновить шаблон сертификата
 */

import { z } from 'zod';
import { 
  getTemplateById, 
  updateTemplate 
} from '../../../repositories/certificateTemplateRepository';
import { logActivity } from '../../../utils/activityLogger';

const variableMappingSchema = z.object({
  placeholder: z.string(),
  source: z.string(),
  customValue: z.string().optional(),
  dateFormat: z.string().optional(),
});

const qrSettingsSchema = z.object({
  enabled: z.boolean(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(50).max(500),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  variables: z.array(variableMappingSchema).optional(),
  qrSettings: qrSettingsSchema.optional(),
  numberFormat: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  // Поля визуального редактора
  templateData: z.any().optional(), // JSON структура шаблона
  layout: z.string().optional(),
  backgroundUrl: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID шаблона обязателен',
      });
    }

    // Проверяем существование
    const existing = await getTemplateById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Шаблон не найден',
      });
    }

    const body = await readBody(event);
    const validated = updateTemplateSchema.parse(body);

    const template = await updateTemplate(id, validated as any);

    // Логируем действие
    await logActivity(
      event,
      'UPDATE',
      'CERTIFICATE_TEMPLATE',
      id,
      template?.name || existing.name,
      { updatedFields: Object.keys(validated) }
    );

    console.log(`[PUT /api/certificates/templates/${id}] Обновлён шаблон: ${template?.name}`);

    return {
      success: true,
      template,
      message: 'Шаблон успешно обновлён',
    };
  } catch (error: any) {
    console.error('[PUT /api/certificates/templates/[id]] Error:', error);

    if (error.statusCode) {
      throw error;
    }

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка обновления шаблона',
    });
  }
});
