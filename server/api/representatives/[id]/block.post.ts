import { defineEventHandler, readBody, createError } from 'h3';
import { blockRepresentative, getRepresentativeById } from '../../../repositories/representativeRepository';
import { logActivity } from '../../../utils/activityLogger';
import { notifyRepresentativeAboutBlock } from '../../../services/notificationService';

/**
 * POST /api/representatives/:id/block
 * Блокировка представителя
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

    if (existing.status === 'blocked') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Представитель уже заблокирован',
      });
    }

    const body = await readBody(event);
    const reason = body?.reason as string;

    if (!reason || !reason.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Укажите причину блокировки',
      });
    }

    const updated = await blockRepresentative(id, userId, reason.trim());

    // Логирование действия
    await logActivity(
      event,
      'BLOCK',
      'REPRESENTATIVE',
      id,
      existing.fullName,
      {
        reason: reason.trim(),
        organizationId: existing.organizationId,
        organizationName: existing.organizationName,
        previousStatus: existing.status,
      }
    );

    // Отправляем уведомление в Telegram
    if (updated?.id) {
      notifyRepresentativeAboutBlock(updated.id, reason.trim()).catch((err) => {
        console.error('[Telegram] Ошибка отправки уведомления о блокировке:', err);
      });
    }

    return {
      success: true,
      data: updated,
      message: 'Представитель заблокирован',
    };
  } catch (error: any) {
    console.error('Error blocking representative:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при блокировке представителя',
    });
  }
});
