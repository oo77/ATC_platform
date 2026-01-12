/**
 * PATCH /api/representatives/[id]
 * Обновить данные представителя (включая разрешения)
 */

import { z } from 'zod';
import { updateRepresentative } from '../../repositories/representativeRepository';
import { logActivity } from '../../utils/activityLogger';

const updateSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(20).optional(),
  accessGroups: z.array(z.string().uuid()).nullable().optional(),
  notificationsEnabled: z.boolean().optional(),
  canReceiveNotifications: z.boolean().optional(),
  permissions: z.object({
    can_view_students: z.boolean(),
    can_view_schedule: z.boolean(),
    can_view_certificates: z.boolean(),
    can_request_certificates: z.boolean(),
  }).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID представителя обязателен',
      });
    }

    const body = await readBody(event);
    const validated = updateSchema.parse(body);

    // Обновляем представителя
    const representative = await updateRepresentative(id, validated);

    if (!representative) {
      throw createError({
        statusCode: 404,
        message: 'Представитель не найден',
      });
    }

    // Логируем изменение
    await logActivity(
      event,
      'UPDATE',
      'REPRESENTATIVE',
      id,
      representative.fullName,
      {
        changes: validated,
      }
    );

    return {
      success: true,
      data: representative,
    };
  } catch (error: any) {
    console.error('[API] Ошибка обновления представителя:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка обновления представителя',
    });
  }
});
