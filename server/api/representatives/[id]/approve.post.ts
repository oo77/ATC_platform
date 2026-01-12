import { defineEventHandler, readBody, createError } from 'h3';
import { approveRepresentative, getRepresentativeById } from '../../../repositories/representativeRepository';
import { logActivity } from '../../../utils/activityLogger';
import { notifyRepresentativeAboutApproval } from '../../../services/notificationService';

/**
 * POST /api/representatives/:id/approve
 * Одобрение заявки представителя
 */
export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const userId = event.context.user?.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID представителя не указан',
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Необходима авторизация',
      });
    }

    const existing = await getRepresentativeById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Представитель не найден',
      });
    }

    if (existing.status === 'approved') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Представитель уже одобрен',
      });
    }

    const body = await readBody(event);
    const accessGroups = body?.accessGroups as string[] | undefined;

    const updated = await approveRepresentative(id, userId, accessGroups);

    // Логирование действия
    await logActivity(
      event,
      'APPROVE',
      'REPRESENTATIVE',
      id,
      existing.fullName,
      {
        accessGroups,
        organizationId: existing.organizationId,
        organizationName: existing.organizationName,
        previousStatus: existing.status,
      }
    );

    // Отправляем уведомление в Telegram
    if (updated?.id) {
      notifyRepresentativeAboutApproval(updated.id).catch((err) => {
        console.error('[Telegram] Ошибка отправки уведомления об одобрении:', err);
      });
    }

    return {
      success: true,
      data: updated,
      message: 'Представитель успешно одобрен',
    };
  } catch (error: any) {
    console.error('Error approving representative:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при одобрении представителя',
    });
  }
});
