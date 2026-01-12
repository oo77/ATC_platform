/**
 * Общие типы для импорта студентов (используются и на клиенте, и на сервере)
 */

// Строка из Excel файла
export interface ExcelStudentRow {
  ПИНФЛ: string;
  ФИО: string;
  Организация: string;
  'Служба/Отдел': string;
  Должность: string;
}

// Обработанные данные студента для импорта
export interface ImportStudentData {
  pinfl: string;
  fullName: string;
  organization: string;
  department: string | null;
  position: string;
  rowNumber: number; // Номер строки в Excel для отслеживания ошибок
}

// Результат валидации строки
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  rowNumber: number;
  data?: ImportStudentData;
}

// Анализ импорта
export interface ImportAnalysis {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newStudents: number; // Будут созданы
  existingStudents: number; // Будут обновлены
  errors: Array<{
    rowNumber: number;
    errors: string[];
  }>;
  preview: ImportStudentData[]; // Первые 20 строк для предпросмотра
}

// Статус задачи импорта
export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Прогресс импорта
export interface ImportProgress {
  jobId: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  createdCount: number;
  updatedCount: number;
  errors: Array<{
    rowNumber: number;
    pinfl: string;
    error: string;
  }>;
  startedAt: Date;
  completedAt?: Date;
}

// Результат импорта
export interface ImportResult {
  success: boolean;
  jobId: string;
  totalProcessed: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    pinfl: string;
    error: string;
  }>;
  duration: number; // в миллисекундах
}

// ============================================================================
// ИМПОРТ СЕРТИФИКАТОВ
// ============================================================================

/**
 * Конфигурация импорта сертификатов
 */
export interface CertificateImportConfig {
  // Источник курса
  courseSource: 'existing' | 'manual';
  courseId?: string;           // Если выбран существующий курс
  courseName?: string;         // Если ручной ввод
  courseCode?: string;
  courseHours?: number;

  // Срок действия сертификатов
  validityType: 'unlimited' | 'months';  // Бессрочный или с ограничением
  validityMonths?: number;               // Количество месяцев (если validityType = 'months')
  // expiry_date рассчитывается: issue_date + validityMonths

  // Настройки URL
  urlTemplate: string;         // Шаблон URL с переменными

  // Опции импорта
  createStudents: boolean;     // Создавать ли новых слушателей
  updateExisting: boolean;     // Обновлять ли существующие сертификаты
  skipErrors: boolean;         // Пропускать ли строки с ошибками
}

/**
 * Строка из Excel файла для сертификатов
 */
export interface ExcelCertificateRow {
  'ПИНФЛ': string;
  'ФИО': string;
  'Организация': string;
  'Должность': string;
  'Серия/Номер': string;
  'Дата выдачи': string;
}

/**
 * Обработанная строка импорта сертификата
 */
export interface CertificateImportRow {
  rowNumber: number;
  pinfl: string;
  fullName: string;
  organization: string;
  position: string;
  certificateNumber: string;
  issueDate: string;         // ISO формат
  generatedUrl: string;

  // Статус проверки
  status: 'valid' | 'warning' | 'error';
  studentStatus: 'exists' | 'new' | 'not_found';
  certificateStatus: 'new' | 'duplicate';
  existingStudentId?: string;  // ID существующего студента
  errors: string[];
  warnings: string[];
}

/**
 * Результат анализа файла импорта сертификатов
 */
export interface CertificateImportAnalysis {
  // Статистика
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;

  // Слушатели
  existingStudents: number;
  newStudents: number;

  // Сертификаты
  newCertificates: number;
  duplicateCertificates: number;

  // Данные
  preview: CertificateImportRow[];
  errors: { rowNumber: number; errors: string[] }[];

  // Ссылки на существующих
  existingPinfls: string[];
  existingCertNumbers: string[];
}

/**
 * Прогресс импорта сертификатов
 */
export interface CertificateImportProgress {
  jobId: string;
  status: ImportStatus;
  totalRecords: number;
  processedRecords: number;
  createdStudents: number;
  createdCertificates: number;
  errors: { rowNumber: number; error: string }[];
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Результат импорта сертификатов
 */
export interface CertificateImportResult {
  success: boolean;
  jobId: string;
  totalProcessed: number;
  createdStudents: number;
  createdCertificates: number;
  skipped: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    certificateNumber: string;
    error: string;
  }>;
  duration: number; // в миллисекундах
}
