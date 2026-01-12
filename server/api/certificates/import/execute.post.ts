/**
 * API для выполнения импорта сертификатов
 * POST /api/certificates/import/execute
 */

import { defineEventHandler, readBody, createError } from 'h3';
import { requireAuth, requireAnyPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';
import {
    createCertificateImportJob,
    executeCertificateImport,
    cleanupOldCertificateImportJobs,
} from '../../../utils/certificateImportUtils';
import type {
    CertificateImportRow,
    CertificateImportConfig,
} from '../../../types/import';
import { z } from 'zod';

// Схема валидации запроса
const ExecuteSchema = z.object({
    rows: z.array(z.object({
        rowNumber: z.number(),
        pinfl: z.string(),
        fullName: z.string(),
        organization: z.string(),
        position: z.string(),
        certificateNumber: z.string(),
        issueDate: z.string(),
        expiryDate: z.string().nullable().optional(),
        generatedUrl: z.string(),
        status: z.enum(['valid', 'warning', 'error']),
        studentStatus: z.enum(['exists', 'new', 'not_found']),
        studentId: z.string().optional(),
        certificateStatus: z.enum(['new', 'duplicate']),
        existingCertificateId: z.string().optional(),
        errors: z.array(z.string()),
        warnings: z.array(z.string()),
    })),
    config: z.object({
        courseSource: z.enum(['existing', 'manual']),
        courseId: z.string().optional(),
        courseName: z.string().optional(),
        courseCode: z.string().optional(),
        courseHours: z.number().optional(),
        validityType: z.enum(['unlimited', 'months']),
        validityMonths: z.number().optional(),
        urlTemplate: z.string(),
        createStudents: z.boolean(),
        updateExisting: z.boolean(),
        skipErrors: z.boolean(),
    }),
    courseInfo: z.object({
        name: z.string(),
        code: z.string().optional(),
        hours: z.number().optional(),
    }),
});

export default defineEventHandler(async (event) => {
    // Проверка авторизации
    const context = await requireAuth(event);
    await requireAnyPermission(event, [Permission.CERTIFICATES_ISSUE]);

    // Очищаем старые задачи
    cleanupOldCertificateImportJobs();

    // Получаем тело запроса
    const body = await readBody(event);

    // Валидация
    const parsed = ExecuteSchema.safeParse(body);

    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            statusMessage: `Ошибка валидации данных: ${parsed.error.issues.map(i => i.message).join(', ')}`,
        });
    }

    const { rows, config, courseInfo } = parsed.data;

    // Фильтруем только строки, готовые к импорту
    let rowsToImport: CertificateImportRow[];

    if (config.skipErrors) {
        // Импортируем только valid и warning (если updateExisting или это новые сертификаты)
        rowsToImport = rows.filter(row => {
            if (row.status === 'error') return false;
            if (row.certificateStatus === 'duplicate' && !config.updateExisting) return false;
            return true;
        }) as CertificateImportRow[];
    } else {
        rowsToImport = rows.filter(row => row.status !== 'error') as CertificateImportRow[];
    }

    if (rowsToImport.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Нет данных для импорта (все строки с ошибками или дубликаты)',
        });
    }

    console.log(`[CertificateImport] Начинаю импорт ${rowsToImport.length} сертификатов...`);

    // Создаём задачу импорта
    const jobId = createCertificateImportJob(rowsToImport.length);

    // Запускаем импорт асинхронно
    // Используем setImmediate чтобы не блокировать ответ
    setImmediate(async () => {
        try {
            await executeCertificateImport(
                rowsToImport,
                config as CertificateImportConfig,
                courseInfo,
                jobId,
                context.userId
            );
            console.log(`[CertificateImport] Импорт ${jobId} завершён успешно`);
        } catch (error) {
            console.error(`[CertificateImport] Ошибка импорта ${jobId}:`, error);
        }
    });

    return {
        success: true,
        jobId,
        totalRecords: rowsToImport.length,
        message: `Импорт запущен. Используйте GET /api/certificates/import/status/${jobId} для отслеживания прогресса.`,
    };
});
