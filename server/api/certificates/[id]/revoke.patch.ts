/**
 * API endpoint для отзыва сертификата
 * PATCH /api/certificates/:id/revoke
 * 
 * Отзывает выданный сертификат с указанием причины
 */

import { getIssuedCertificateById, revokeCertificate } from '../../../repositories/certificateTemplateRepository';
import { logActivity } from '../../../utils/activityLogger';

export default defineEventHandler(async (event) => {
  try {
    // Проверка авторизации
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация',
      });
    }

    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        success: false,
        message: 'ID сертификата не указан',
      };
    }

    // Получаем тело запроса
    const body = await readBody(event);
    const reason = body?.reason?.trim();

    if (!reason) {
      return {
        success: false,
        message: 'Необходимо указать причину отзыва',
      };
    }

    // Получаем сертификат
    const certificate = await getIssuedCertificateById(id);
    
    if (!certificate) {
      return {
        success: false,
        message: 'Сертификат не найден',
      };
    }

    // Проверяем статус
    if (certificate.status === 'revoked') {
      return {
        success: false,
        message: 'Сертификат уже отозван',
      };
    }

    if (certificate.status === 'draft') {
      return {
        success: false,
        message: 'Нельзя отозвать черновик сертификата',
      };
    }

    // Отзываем сертификат
    const revokedCertificate = await revokeCertificate(id, user.id, reason);

    if (!revokedCertificate) {
      return {
        success: false,
        message: 'Не удалось отозвать сертификат',
      };
    }

    // Логируем действие
    await logActivity(
      event,
      'REVOKE',
      'ISSUED_CERTIFICATE',
      id,
      `Сертификат ${certificate.certificateNumber}`,
      {
        certificateNumber: certificate.certificateNumber,
        studentId: certificate.studentId,
        reason: reason,
        previousStatus: certificate.status,
      }
    );

    console.log(`✅ Сертификат ${certificate.certificateNumber} отозван пользователем ${user.id}. Причина: ${reason}`);

    return {
      success: true,
      message: 'Сертификат успешно отозван',
      certificate: revokedCertificate,
    };
  } catch (error) {
    console.error('Ошибка отзыва сертификата:', error);
    
    return {
      success: false,
      message: 'Ошибка при отзыве сертификата',
    };
  }
});
