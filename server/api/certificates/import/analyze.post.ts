/**
 * API для анализа Excel-файла с сертификатами перед импортом
 * POST /api/certificates/import/analyze
 */

import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { requireAuth, requireAnyPermission } from '../../../utils/permissions';
import { Permission } from '../../../types/permissions';
import { parseCertificateExcel, analyzeCertificateImportData } from '../../../utils/certificateImportUtils';
import type { CertificateImportConfig } from '../../../types/import';
import { z } from 'zod';

// Схема валидации конфигурации
const ConfigSchema = z.object({
    courseSource: z.enum(['existing', 'manual']),
    courseId: z.string().optional(),
    courseName: z.string().optional(),
    courseCode: z.string().optional(),
    courseHours: z.number().optional(),
    validityType: z.enum(['unlimited', 'months']),
    validityMonths: z.number().optional(),
    urlTemplate: z.string().default(''),
    createStudents: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    skipErrors: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
    // Проверка авторизации
    const user = await requireAuth(event);
    await requireAnyPermission(event, [Permission.CERTIFICATES_ISSUE]);

    // Получаем multipart данные
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Файл не загружен',
        });
    }

    // Ищем файл и конфигурацию
    let fileBuffer: Buffer | null = null;
    let config: CertificateImportConfig | null = null;

    for (const part of formData) {
        if (part.name === 'file' && part.data) {
            // Проверяем тип файла
            const filename = part.filename?.toLowerCase() || '';
            if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Неподдерживаемый формат файла. Используйте .xlsx или .xls',
                });
            }
            fileBuffer = part.data;
        }

        if (part.name === 'config' && part.data) {
            try {
                const rawConfig = JSON.parse(part.data.toString('utf-8'));
                const parsed = ConfigSchema.safeParse(rawConfig);

                if (!parsed.success) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: `Ошибка валидации конфигурации: ${parsed.error.issues.map(i => i.message).join(', ')}`,
                    });
                }

                config = parsed.data as CertificateImportConfig;
            } catch (e) {
                if (e instanceof Error && 'statusCode' in e) throw e;
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Неверный формат конфигурации',
                });
            }
        }
    }

    if (!fileBuffer) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Excel-файл не найден в запросе',
        });
    }

    if (!config) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Конфигурация импорта не указана',
        });
    }

    // Дополнительная валидация конфигурации
    if (config.courseSource === 'existing' && !config.courseId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Для существующего курса необходимо указать courseId',
        });
    }

    if (config.courseSource === 'manual' && !config.courseName) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Для ручного ввода необходимо указать название курса',
        });
    }

    if (config.validityType === 'months' && (!config.validityMonths || config.validityMonths <= 0)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'При ограниченном сроке действия необходимо указать количество месяцев',
        });
    }

    try {
        // Парсим Excel
        console.log('[CertificateImport] Парсинг Excel файла...');
        const rows = parseCertificateExcel(fileBuffer);

        if (rows.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Файл не содержит данных для импорта',
            });
        }

        console.log(`[CertificateImport] Найдено ${rows.length} строк, начинаю анализ...`);

        // Анализируем данные
        const analysis = await analyzeCertificateImportData(rows, config);

        console.log(`[CertificateImport] Анализ завершён:`, {
            totalRows: analysis.totalRows,
            validRows: analysis.validRows,
            errorRows: analysis.errorRows,
            newStudents: analysis.newStudents,
            newCertificates: analysis.newCertificates,
        });

        return {
            success: true,
            analysis,
        };
    } catch (error) {
        console.error('[CertificateImport] Ошибка анализа:', error);

        // Пробрасываем HTTP ошибки
        if (error instanceof Error && 'statusCode' in error) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error instanceof Error ? error.message : 'Ошибка анализа файла',
        });
    }
});
