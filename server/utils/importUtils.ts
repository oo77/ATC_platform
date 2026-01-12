/**
 * Утилиты для импорта студентов из Excel
 * Работает с MySQL через репозиторий
 */

// Используем createRequire для импорта CommonJS модуля xlsx
// Это решает проблему с ESM URL scheme на Windows
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx') as typeof import('xlsx');

import type {
  ExcelStudentRow,
  ImportStudentData,
  ValidationResult,
  ImportAnalysis,
  ImportProgress,
  ImportStatus,
} from '../types/import';
import {
  getAllStudents,
  batchUpsertStudentsWithProgress,
} from '../repositories/studentRepository';

// Хранилище активных задач импорта
const importJobs = new Map<string, ImportProgress>();

/**
 * Маппинг альтернативных названий заголовков на стандартные
 */
const HEADER_MAPPINGS: Record<string, string> = {
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
  // Служба/Отдел
  'служба/отдел': 'Служба/Отдел',
  'служба': 'Служба/Отдел',
  'отдел': 'Служба/Отдел',
  'подразделение': 'Служба/Отдел',
  'department': 'Служба/Отдел',
  // Должность
  'должность': 'Должность',
  'position': 'Должность',
  'позиция': 'Должность',
  'title': 'Должность',
};

/**
 * Нормализация заголовка: приводит к стандартному виду
 */
function normalizeHeader(header: string): string {
  if (!header) return '';

  const trimmed = String(header).trim();
  const lowercased = trimmed.toLowerCase();

  // Ищем в маппинге
  if (HEADER_MAPPINGS[lowercased]) {
    return HEADER_MAPPINGS[lowercased];
  }

  // Возвращаем оригинал (с trim)
  return trimmed;
}

/**
 * Парсинг Excel файла
 */
export function parseExcelFile(buffer: Buffer): ExcelStudentRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Преобразуем в JSON с заголовками
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  }) as ExcelStudentRow[];

  // Первая строка - заголовки
  if (data.length === 0) {
    throw new Error('Файл пустой');
  }

  // Преобразуем массив массивов в объекты
  const rawHeaders = data[0] as unknown as string[];
  // Нормализуем заголовки
  const headers = rawHeaders.map(h => normalizeHeader(String(h || '')));

  console.log('[ImportUtils] Нормализованные заголовки:', headers);

  const rows: ExcelStudentRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown as any[];
    if (row.length === 0 || !row.some(cell => cell)) {
      continue; // Пропускаем пустые строки
    }

    const rowObj: any = {};
    headers.forEach((header, index) => {
      // Используем нормализованный заголовок
      if (header) {
        rowObj[header] = row[index] !== undefined && row[index] !== null
          ? String(row[index]).trim()
          : '';
      }
    });
    rows.push(rowObj as ExcelStudentRow);
  }

  return rows;
}

/**
 * Валидация ПИНФЛ
 */
function validatePinfl(pinfl: string): boolean {
  // ПИНФЛ должен быть 14 цифр
  return /^\d{14}$/.test(pinfl.trim());
}

/**
 * Валидация строки данных
 */
function validateRow(row: ExcelStudentRow, rowNumber: number): ValidationResult {
  const errors: string[] = [];

  // Проверка ПИНФЛ
  if (!row.ПИНФЛ || !row.ПИНФЛ.trim()) {
    errors.push('ПИНФЛ не указан');
  } else if (!validatePinfl(row.ПИНФЛ)) {
    errors.push('ПИНФЛ должен содержать 14 цифр');
  }

  // Проверка ФИО
  if (!row.ФИО || !row.ФИО.trim()) {
    errors.push('ФИО не указано');
  } else if (row.ФИО.trim().length < 3) {
    errors.push('ФИО слишком короткое');
  }

  // Проверка организации
  if (!row.Организация || !row.Организация.trim()) {
    errors.push('Организация не указана');
  }

  // Проверка должности
  if (!row.Должность || !row.Должность.trim()) {
    errors.push('Должность не указана');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      rowNumber,
    };
  }

  // Формируем данные для импорта
  const data: ImportStudentData = {
    pinfl: row.ПИНФЛ.trim(),
    fullName: row.ФИО.trim(),
    organization: row.Организация.trim(),
    department: row['Служба/Отдел']?.trim() || null,
    position: row.Должность.trim(),
    rowNumber,
  };

  return {
    isValid: true,
    errors: [],
    rowNumber,
    data,
  };
}

/**
 * Анализ данных перед импортом
 */
export async function analyzeImportData(rows: ExcelStudentRow[]): Promise<ImportAnalysis> {
  const validationResults: ValidationResult[] = [];
  const validData: ImportStudentData[] = [];
  const errors: Array<{ rowNumber: number; errors: string[] }> = [];

  // Валидация всех строк
  rows.forEach((row, index) => {
    const result = validateRow(row, index + 2); // +2 потому что: +1 для заголовка, +1 для 1-based индекса
    validationResults.push(result);

    if (result.isValid && result.data) {
      validData.push(result.data);
    } else {
      errors.push({
        rowNumber: result.rowNumber,
        errors: result.errors,
      });
    }
  });

  // Получаем существующих студентов из БД
  const existingStudents = await getAllStudents();
  const existingPinfls = new Set(existingStudents.map(s => s.pinfl));

  // Подсчитываем новых и существующих
  let newStudents = 0;
  let existingStudentsCount = 0;
  const existingPinflsInImport: string[] = []; // ПИНФЛ из импорта которые уже есть в БД

  validData.forEach(data => {
    if (existingPinfls.has(data.pinfl)) {
      existingStudentsCount++;
      existingPinflsInImport.push(data.pinfl);
    } else {
      newStudents++;
    }
  });

  return {
    totalRows: rows.length,
    validRows: validData.length,
    invalidRows: errors.length,
    newStudents,
    existingStudents: existingStudentsCount,
    existingPinfls: existingPinflsInImport, // Передаём список существующих ПИНФЛ
    errors,
    preview: validData.slice(0, 20), // Первые 20 строк для предпросмотра
  };
}

/**
 * Создание задачи импорта
 */
export function createImportJob(totalRows: number): string {
  const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const job: ImportProgress = {
    jobId,
    status: 'pending' as ImportStatus,
    totalRows,
    processedRows: 0,
    successCount: 0,
    errorCount: 0,
    createdCount: 0,
    updatedCount: 0,
    errors: [],
    startedAt: new Date(),
  };

  importJobs.set(jobId, job);
  return jobId;
}

/**
 * Получение статуса задачи импорта
 */
export function getImportJobStatus(jobId: string): ImportProgress | null {
  return importJobs.get(jobId) || null;
}

/**
 * Обновление прогресса задачи
 */
function updateJobProgress(
  jobId: string,
  updates: Partial<ImportProgress>
): void {
  const job = importJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}

/**
 * Выполнение импорта с batch-обработкой через MySQL
 */
export async function executeImport(
  data: ImportStudentData[],
  jobId: string,
  batchSize: number = 100
): Promise<void> {
  const job = importJobs.get(jobId);
  if (!job) {
    throw new Error('Задача импорта не найдена');
  }

  updateJobProgress(jobId, { status: 'processing' as ImportStatus });

  try {
    // Используем batch upsert из репозитория
    const result = await batchUpsertStudentsWithProgress(
      data.map(item => ({
        pinfl: item.pinfl,
        fullName: item.fullName,
        organization: item.organization,
        department: item.department,
        position: item.position,
        rowNumber: item.rowNumber,
      })),
      // Callback для отслеживания прогресса
      (processed, created, updated, errors) => {
        updateJobProgress(jobId, {
          processedRows: processed,
          createdCount: created,
          updatedCount: updated,
          errorCount: errors,
          successCount: created + updated,
        });
      },
      batchSize
    );

    // Завершаем задачу
    updateJobProgress(jobId, {
      status: 'completed' as ImportStatus,
      completedAt: new Date(),
      processedRows: data.length,
      createdCount: result.created,
      updatedCount: result.updated,
      errorCount: result.errors.length,
      successCount: result.created + result.updated,
      errors: result.errors.map(e => ({
        rowNumber: 0, // У нас нет rowNumber в errors из репозитория
        pinfl: e.pinfl,
        error: e.error,
      })),
    });
  } catch (error) {
    updateJobProgress(jobId, {
      status: 'failed' as ImportStatus,
      completedAt: new Date(),
      errors: [{
        rowNumber: 0,
        pinfl: '',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      }],
    });
    throw error;
  }
}

/**
 * Очистка старых задач (старше 1 часа)
 */
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [jobId, job] of importJobs.entries()) {
    if (job.startedAt.getTime() < oneHourAgo) {
      importJobs.delete(jobId);
    }
  }
}

/**
 * Получить все валидные данные из Excel строк
 * (для использования в execute.post.ts)
 */
export function getValidImportData(rows: ExcelStudentRow[]): ImportStudentData[] {
  const validData: ImportStudentData[] = [];

  rows.forEach((row, index) => {
    const result = validateRow(row, index + 2);
    if (result.isValid && result.data) {
      validData.push(result.data);
    }
  });

  return validData;
}
