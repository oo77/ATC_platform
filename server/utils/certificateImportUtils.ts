/**
 * Утилиты для импорта сертификатов из Excel
 * Работает с MySQL через репозитории
 */

// Используем createRequire для импорта CommonJS модуля xlsx
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx') as typeof import('xlsx');

import type {
    ExcelCertificateRow,
    CertificateImportConfig,
    CertificateImportRow,
    CertificateImportAnalysis,
    CertificateImportProgress,
    ImportStatus,
} from '../types/import';
import { getStudentByPinfl, createStudent } from '../repositories/studentRepository';
import {
    getCertificateByNumber,
    createStandaloneCertificate,
} from '../repositories/certificateTemplateRepository';
import { getCourseById } from '../repositories/courseRepository';
import { logActivityDirect } from './activityLogger';

// Хранилище активных задач импорта сертификатов
const certificateImportJobs = new Map<string, CertificateImportProgress>();

// ============================================================================
// МАППИНГ ЗАГОЛОВКОВ
// ============================================================================

/**
 * Маппинг альтернативных названий заголовков на стандартные
 */
const CERTIFICATE_HEADER_MAPPINGS: Record<string, string> = {
    // ПИНФЛ
    'пинфл': 'ПИНФЛ',
    'pinfl': 'ПИНФЛ',
    'пінфл': 'ПИНФЛ',
    'инн': 'ПИНФЛ',
    'идентификатор': 'ПИНФЛ',
    // ФИО
    'фио': 'ФИО',
    'ф.и.о': 'ФИО',
    'ф.и.о.': 'ФИО',
    'полное имя': 'ФИО',
    'имя': 'ФИО',
    'name': 'ФИО',
    'fullname': 'ФИО',
    'full_name': 'ФИО',
    // Организация  
    'организация': 'Организация',
    'organization': 'Организация',
    'компания': 'Организация',
    'предприятие': 'Организация',
    'место работы': 'Организация',
    // Должность
    'должность': 'Должность',
    'position': 'Должность',
    'позиция': 'Должность',
    'title': 'Должность',
    // Серия/Номер
    'серия/номер': 'Серия/Номер',
    'серия': 'Серия/Номер',
    'номер': 'Серия/Номер',
    'номер сертификата': 'Серия/Номер',
    'certificate_number': 'Серия/Номер',
    'certificate number': 'Серия/Номер',
    'cert_number': 'Серия/Номер',
    'number': 'Серия/Номер',
    '№': 'Серия/Номер',
    // Дата выдачи
    'дата выдачи': 'Дата выдачи',
    'дата': 'Дата выдачи',
    'date': 'Дата выдачи',
    'issue_date': 'Дата выдачи',
    'issued': 'Дата выдачи',
    'выдан': 'Дата выдачи',
};

/**
 * Нормализация заголовка
 */
function normalizeHeader(header: string): string {
    if (!header) return '';

    const trimmed = String(header).trim();
    const lowercased = trimmed.toLowerCase();

    if (CERTIFICATE_HEADER_MAPPINGS[lowercased]) {
        return CERTIFICATE_HEADER_MAPPINGS[lowercased];
    }

    return trimmed;
}

// ============================================================================
// ПАРСИНГ EXCEL
// ============================================================================

/**
 * Парсит дату в формате DD.MM.YYYY или из Excel serial number
 */
function parseDate(value: any): Date | null {
    if (!value) return null;

    // Если это число (Excel serial date)
    if (typeof value === 'number') {
        // Excel считает дни с 1 января 1900
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        return isNaN(date.getTime()) ? null : date;
    }

    const str = String(value).trim();

    // Формат DD.MM.YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? null : date;
    }

    // Формат YYYY-MM-DD
    const yyyymmdd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
        const [, year, month, day] = yyyymmdd;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? null : date;
    }

    // Попытка стандартного парсинга
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Парсинг Excel файла для сертификатов
 */
export function parseCertificateExcel(buffer: Buffer): ExcelCertificateRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Преобразуем в JSON с заголовками
    const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: true, // Получаем сырые данные для корректной обработки дат
    }) as any[][];

    if (data.length === 0) {
        throw new Error('Файл пустой');
    }

    // Нормализуем заголовки
    const rawHeaders = data[0] as string[];
    const headers = rawHeaders.map(h => normalizeHeader(String(h || '')));

    console.log('[CertificateImport] Нормализованные заголовки:', headers);

    const rows: ExcelCertificateRow[] = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0 || !row.some(cell => cell)) {
            continue; // Пропускаем пустые строки
        }

        const rowObj: any = {};
        headers.forEach((header, index) => {
            if (header) {
                const value = row[index];
                // Для даты выдачи парсим специально
                if (header === 'Дата выдачи') {
                    const parsed = parseDate(value);
                    rowObj[header] = parsed ? parsed.toISOString().split('T')[0] : '';
                } else {
                    rowObj[header] = value !== undefined && value !== null
                        ? String(value).trim()
                        : '';
                }
            }
        });
        rows.push(rowObj as ExcelCertificateRow);
    }

    return rows;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

/**
 * Валидация ПИНФЛ
 */
function validatePinfl(pinfl: string): boolean {
    return /^\d{14}$/.test(pinfl.trim());
}

/**
 * Валидация строки сертификата
 */
function validateCertificateRow(
    row: ExcelCertificateRow,
    rowNumber: number
): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ПИНФЛ
    const pinfl = row.ПИНФЛ?.trim() || '';
    if (!pinfl) {
        errors.push('ПИНФЛ не указан');
    } else if (!validatePinfl(pinfl)) {
        errors.push(`ПИНФЛ должен содержать 14 цифр (найдено: ${pinfl.length})`);
    }

    // ФИО
    const fullName = row.ФИО?.trim() || '';
    if (!fullName) {
        errors.push('ФИО не указано');
    } else if (fullName.length < 3) {
        errors.push('ФИО слишком короткое');
    }

    // Организация
    const organization = row.Организация?.trim() || '';
    if (!organization) {
        warnings.push('Организация не указана');
    }

    // Должность
    const position = row.Должность?.trim() || '';
    if (!position) {
        warnings.push('Должность не указана');
    }

    // Номер сертификата
    const certNumber = row['Серия/Номер']?.trim() || '';
    if (!certNumber) {
        errors.push('Номер сертификата не указан');
    }

    // Дата выдачи
    const issueDateStr = row['Дата выдачи']?.trim() || '';
    if (!issueDateStr) {
        errors.push('Дата выдачи не указана');
    }

    return { errors, warnings };
}

// ============================================================================
// ГЕНЕРАЦИЯ URL
// ============================================================================

/**
 * Генерация URL сертификата по шаблону
 */
export function generateCertificateUrl(
    template: string,
    row: CertificateImportRow
): string {
    if (!template) return '';

    return template
        .replace(/{NUM}/g, row.certificateNumber)
        .replace(/{FIO}/g, row.fullName.replace(/\s+/g, '_'))
        .replace(/{PINFL}/g, row.pinfl)
        .replace(/{DATE}/g, row.issueDate.replace(/-/g, ''));
}

/**
 * Расчёт даты истечения сертификата
 */
function calculateExpiryDate(issueDate: Date, validityMonths: number): Date {
    const expiry = new Date(issueDate);
    expiry.setMonth(expiry.getMonth() + validityMonths);
    return expiry;
}

// ============================================================================
// АНАЛИЗ ДАННЫХ
// ============================================================================

/**
 * Анализ данных перед импортом сертификатов
 */
export async function analyzeCertificateImportData(
    rows: ExcelCertificateRow[],
    config: CertificateImportConfig
): Promise<CertificateImportAnalysis> {
    const processedRows: CertificateImportRow[] = [];
    const errors: Array<{ rowNumber: number; errors: string[] }> = [];
    const existingPinfls: string[] = [];
    const existingCertNumbers: string[] = [];

    // Подсчёт статистики
    let validRows = 0;
    let errorRows = 0;
    let warningRows = 0;
    let existingStudents = 0;
    let newStudents = 0;
    let newCertificates = 0;
    let duplicateCertificates = 0;

    // Получаем информацию о курсе
    let courseInfo: { name: string; code?: string; hours?: number };

    if (config.courseSource === 'existing' && config.courseId) {
        const course = await getCourseById(config.courseId);
        if (!course) {
            throw new Error('Курс не найден');
        }
        courseInfo = {
            name: course.name,
            code: course.code,
            hours: course.totalHours,
        };
    } else {
        courseInfo = {
            name: config.courseName || 'Курс повышения квалификации',
            code: config.courseCode,
            hours: config.courseHours,
        };
    }

    // Обрабатываем каждую строку
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +1 для заголовка, +1 для 1-based индекса

        // Валидация
        const validation = validateCertificateRow(row, rowNumber);

        // Если есть критические ошибки
        if (validation.errors.length > 0) {
            errorRows++;
            errors.push({ rowNumber, errors: validation.errors });

            processedRows.push({
                rowNumber,
                pinfl: row.ПИНФЛ?.trim() || '',
                fullName: row.ФИО?.trim() || '',
                organization: row.Организация?.trim() || '',
                position: row.Должность?.trim() || '',
                certificateNumber: row['Серия/Номер']?.trim() || '',
                issueDate: row['Дата выдачи']?.trim() || '',
                generatedUrl: '',
                status: 'error',
                studentStatus: 'not_found',
                certificateStatus: 'new',
                errors: validation.errors,
                warnings: validation.warnings,
            });
            continue;
        }

        // Данные строки
        const pinfl = row.ПИНФЛ.trim();
        const fullName = row.ФИО.trim();
        const organization = row.Организация?.trim() || '';
        const position = row.Должность?.trim() || '';
        const certificateNumber = row['Серия/Номер'].trim();
        const issueDateStr = row['Дата выдачи'].trim();

        // Проверяем студента в БД
        const existingStudent = await getStudentByPinfl(pinfl);
        let studentStatus: 'exists' | 'new' | 'not_found';
        let studentId: string | undefined;

        if (existingStudent) {
            studentStatus = 'exists';
            studentId = existingStudent.id;
            existingStudents++;
            existingPinfls.push(pinfl);
        } else if (config.createStudents) {
            studentStatus = 'new';
            newStudents++;
        } else {
            studentStatus = 'not_found';
            validation.errors.push('Слушатель не найден в базе данных');
            errorRows++;

            processedRows.push({
                rowNumber,
                pinfl,
                fullName,
                organization,
                position,
                certificateNumber,
                issueDate: issueDateStr,
                generatedUrl: '',
                status: 'error',
                studentStatus,
                certificateStatus: 'new',
                errors: validation.errors,
                warnings: validation.warnings,
            });
            errors.push({ rowNumber, errors: validation.errors });
            continue;
        }

        // Проверяем сертификат по номеру
        const existingCert = await getCertificateByNumber(certificateNumber);
        let certificateStatus: 'new' | 'duplicate';
        let existingCertificateId: string | undefined;

        if (existingCert) {
            certificateStatus = 'duplicate';
            existingCertificateId = existingCert.id;
            duplicateCertificates++;
            existingCertNumbers.push(certificateNumber);

            if (!config.updateExisting) {
                validation.warnings.push('Сертификат с таким номером уже существует');
                warningRows++;
            }
        } else {
            certificateStatus = 'new';
            newCertificates++;
        }

        // Генерируем URL
        const tempRow: CertificateImportRow = {
            rowNumber,
            pinfl,
            fullName,
            organization,
            position,
            certificateNumber,
            issueDate: issueDateStr,
            generatedUrl: '',
            status: 'valid',
            studentStatus,
            studentId,
            certificateStatus,
            existingCertificateId,
            errors: [],
            warnings: validation.warnings,
        };

        tempRow.generatedUrl = generateCertificateUrl(config.urlTemplate, tempRow);

        // Рассчитываем дату истечения
        if (config.validityType === 'months' && config.validityMonths) {
            const issueDate = new Date(issueDateStr);
            tempRow.expiryDate = calculateExpiryDate(issueDate, config.validityMonths).toISOString().split('T')[0];
        }

        // Определяем статус
        if (validation.warnings.length > 0 || certificateStatus === 'duplicate') {
            tempRow.status = 'warning';
            warningRows++;
        } else {
            validRows++;
        }

        processedRows.push(tempRow);
    }

    return {
        totalRows: rows.length,
        validRows,
        errorRows,
        warningRows,
        existingStudents,
        newStudents,
        newCertificates,
        duplicateCertificates,
        preview: processedRows.slice(0, 50), // Первые 50 строк для предпросмотра
        errors,
        existingPinfls,
        existingCertNumbers,
        config,
        courseInfo,
    };
}

// ============================================================================
// УПРАВЛЕНИЕ ЗАДАЧАМИ
// ============================================================================

/**
 * Создание задачи импорта
 */
export function createCertificateImportJob(totalRecords: number): string {
    const jobId = `cert_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: CertificateImportProgress = {
        jobId,
        status: 'pending' as ImportStatus,
        totalRecords,
        processedRecords: 0,
        createdStudents: 0,
        createdCertificates: 0,
        skippedDuplicates: 0,
        errors: [],
        startedAt: new Date(),
    };

    certificateImportJobs.set(jobId, job);
    return jobId;
}

/**
 * Получение статуса задачи
 */
export function getCertificateImportJobStatus(jobId: string): CertificateImportProgress | null {
    return certificateImportJobs.get(jobId) || null;
}

/**
 * Обновление прогресса задачи
 */
function updateCertificateJobProgress(
    jobId: string,
    updates: Partial<CertificateImportProgress>
): void {
    const job = certificateImportJobs.get(jobId);
    if (job) {
        Object.assign(job, updates);
    }
}

// ============================================================================
// ВЫПОЛНЕНИЕ ИМПОРТА
// ============================================================================

/**
 * Выполнение импорта сертификатов
 */
export async function executeCertificateImport(
    rows: CertificateImportRow[],
    config: CertificateImportConfig,
    courseInfo: { name: string; code?: string; hours?: number },
    jobId: string,
    issuedBy?: string
): Promise<void> {
    const job = certificateImportJobs.get(jobId);
    if (!job) {
        throw new Error('Задача импорта не найдена');
    }

    updateCertificateJobProgress(jobId, { status: 'processing' as ImportStatus });

    let createdStudents = 0;
    let createdCertificates = 0;
    let skippedDuplicates = 0;
    const importErrors: Array<{ rowNumber: number; error: string }> = [];

    try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Пропускаем строки с ошибками
            if (row.status === 'error') {
                if (config.skipErrors) {
                    continue;
                } else {
                    importErrors.push({
                        rowNumber: row.rowNumber,
                        error: row.errors.join('; '),
                    });
                    continue;
                }
            }

            try {
                let studentId = row.studentId;

                // Создаём студента если нужно
                if (row.studentStatus === 'new' && config.createStudents) {
                    const newStudent = await createStudent({
                        pinfl: row.pinfl,
                        fullName: row.fullName,
                        organization: row.organization,
                        position: row.position,
                    });
                    studentId = newStudent.id;
                    createdStudents++;
                }

                if (!studentId) {
                    importErrors.push({
                        rowNumber: row.rowNumber,
                        error: 'Не удалось определить студента',
                    });
                    continue;
                }

                // Проверяем дубликат
                if (row.certificateStatus === 'duplicate') {
                    if (!config.updateExisting) {
                        skippedDuplicates++;
                        continue;
                    }
                    // TODO: Обновление существующего сертификата
                    // Пока просто пропускаем
                    skippedDuplicates++;
                    continue;
                }

                // Создаём сертификат
                const issueDate = new Date(row.issueDate);
                let expiryDate: Date | null = null;

                if (row.expiryDate) {
                    expiryDate = new Date(row.expiryDate);
                }

                await createStandaloneCertificate({
                    studentId,
                    certificateNumber: row.certificateNumber,
                    issueDate,
                    expiryDate,
                    courseName: courseInfo.name,
                    courseCode: courseInfo.code,
                    courseHours: courseInfo.hours,
                    sourceType: 'import',
                    pdfFileUrl: row.generatedUrl || undefined,
                    issuedBy,
                    notes: `Импортирован из Excel (строка ${row.rowNumber})`,
                });

                createdCertificates++;
            } catch (error) {
                importErrors.push({
                    rowNumber: row.rowNumber,
                    error: error instanceof Error ? error.message : 'Неизвестная ошибка',
                });
            }

            // Обновляем прогресс
            updateCertificateJobProgress(jobId, {
                processedRecords: i + 1,
                createdStudents,
                createdCertificates,
                skippedDuplicates,
                errors: importErrors,
            });
        }

        // Завершаем задачу
        updateCertificateJobProgress(jobId, {
            status: 'completed' as ImportStatus,
            completedAt: new Date(),
            processedRecords: rows.length,
            createdStudents,
            createdCertificates,
            skippedDuplicates,
            errors: importErrors,
        });

        // Логируем успешный импорт
        if (createdCertificates > 0) {
            await logActivityDirect(
                issuedBy || 'system',
                'IMPORT',
                'ISSUED_CERTIFICATE',
                jobId,
                `Импорт сертификатов: ${courseInfo.name}`,
                {
                    totalRows: rows.length,
                    createdStudents,
                    createdCertificates,
                    skippedDuplicates,
                    errorsCount: importErrors.length,
                    courseName: courseInfo.name,
                }
            );
        }
    } catch (error) {
        updateCertificateJobProgress(jobId, {
            status: 'failed' as ImportStatus,
            completedAt: new Date(),
            errors: [{
                rowNumber: 0,
                error: error instanceof Error ? error.message : 'Критическая ошибка импорта',
            }],
        });
        throw error;
    }
}

/**
 * Очистка старых задач (старше 1 часа)
 */
export function cleanupOldCertificateImportJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [jobId, job] of certificateImportJobs.entries()) {
        if (job.startedAt.getTime() < oneHourAgo) {
            certificateImportJobs.delete(jobId);
        }
    }
}
