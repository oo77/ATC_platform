/**
 * POST /api/certificates/templates
 * Создать новый шаблон сертификата
 */

import { z } from 'zod';
import { createTemplate } from '../../../repositories/certificateTemplateRepository';
import { logActivity } from '../../../utils/activityLogger';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(255),
  description: z.string().max(1000).optional(),
  numberFormat: z.string().max(100).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validated = createTemplateSchema.parse(body);

    const template = await createTemplate({
      name: validated.name,
      description: validated.description,
      numberFormat: validated.numberFormat || 'ATC{YY}_{CODE}_{NUM}',
    });

    // Логируем действие
    await logActivity(
      event,
      'CREATE',
      'CERTIFICATE_TEMPLATE',
      template.id,
      template.name,
      { numberFormat: template.numberFormat }
    );

    console.log(`[POST /api/certificates/templates] Создан шаблон: ${template.name}`);

    return {
      success: true,
      template,
      message: 'Шаблон успешно создан',
    };
  } catch (error: any) {
    console.error('[POST /api/certificates/templates] Error:', error);

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        message: 'Ошибка валидации',
        data: error.errors,
      });
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка создания шаблона',
    });
  }
});
