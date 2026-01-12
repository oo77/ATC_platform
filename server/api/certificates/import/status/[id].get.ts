/**
 * API для получения статуса задачи импорта сертификатов
 * GET /api/certificates/import/status/[id]
 */

import { defineEventHandler, getRouterParam, createError } from 'h3';
import { requireAuth, requireAnyPermission } from '../../../../utils/permissions';
import { Permission } from '../../../../types/permissions';
import { getCertificateImportJobStatus } from '../../../../utils/certificateImportUtils';

export default defineEventHandler(async (event) => {
    // Проверка авторизации
    await requireAuth(event);
    await requireAnyPermission(event, [Permission.CERTIFICATES_ISSUE]);

    // Получаем ID задачи
    const jobId = getRouterParam(event, 'id');

    if (!jobId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID задачи не указан',
        });
    }

    // Получаем статус
    const status = getCertificateImportJobStatus(jobId);

    if (!status) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Задача импорта не найдена или истекла',
        });
    }

    // Рассчитываем прогресс и время
    const progress = status.totalRecords > 0
        ? Math.round((status.processedRecords / status.totalRecords) * 100)
        : 0;

    const duration = status.completedAt
        ? status.completedAt.getTime() - status.startedAt.getTime()
        : Date.now() - status.startedAt.getTime();

    return {
        success: true,
        status: {
            ...status,
            progress,
            duration, // в миллисекундах
        },
    };
});
