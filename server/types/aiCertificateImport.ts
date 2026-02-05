/**
 * Типы для системы AI-импорта сертификатов
 */

import type { IssuedCertificate } from "./certificate";
import type { Student } from "./student";

// ============================================================================
// ИЗВЛЕЧЁННЫЕ ДАННЫЕ ИЗ СЕРТИФИКАТА
// ============================================================================

/**
 * Данные, извлечённые AI из сертификата
 */
export interface ExtractedCertificateData {
  /** ФИО слушателя */
  fullName: string;
  /** Номер сертификата */
  certificateNumber: string;
  /** Дата выдачи (ISO строка) */
  issueDate: string;
  /** Дата окончания срока действия (опционально) */
  expiryDate?: string;
  /** Организация, выдавшая сертификат */
  organization: string;
  /** Название курса */
  courseName: string;
  /** Количество часов курса */
  courseHours?: number;
  /** Должность слушателя */
  position?: string;
  /** Отдел */
  department?: string;
  /** ПИНФЛ (если есть в сертификате) */
  pinfl?: string;
  /** Уровень уверенности AI (0.00-1.00) */
  confidence: number;
  /** Сырой текст, извлечённый из сертификата */
  rawText?: string;
}

// ============================================================================
// СОПОСТАВЛЕНИЕ СО СЛУШАТЕЛЯМИ
// ============================================================================

/**
 * Метод сопоставления слушателя
 */
export type StudentMatchMethod =
  | "exact_pinfl" // Точное совпадение по ПИНФЛ
  | "exact_name" // Точное совпадение по ФИО
  | "fuzzy_ai" // AI-поиск с нечёткими совпадениями
  | "manual" // Ручной выбор администратором
  | "none"; // Не найдено

/**
 * Результат сопоставления со слушателем
 */
export interface StudentMatchResult {
  /** Найденный слушатель (null если не найден) */
  student: Student | null;
  /** Уровень уверенности в совпадении (0.00-1.00) */
  confidence: number;
  /** Метод сопоставления */
  matchMethod: StudentMatchMethod;
  /** Объяснение от AI (для fuzzy_ai) */
  explanation?: string;
  /** Альтернативные кандидаты */
  alternatives?: StudentWithMatchInfo[];
  /** Топ-N альтернатив с процентами (для batch-режима) */
  topAlternatives?: Array<{
    student: Student;
    matchScore: number;
  }>;
}

/**
 * Студент с информацией о совпадении (для отладки)
 */
export interface StudentWithMatchInfo extends Student {
  matchScore?: number;
  matchDebug?: string;
}

// ============================================================================
// РЕЗУЛЬТАТ AI-ОБРАБОТКИ
// ============================================================================

/**
 * Использованные токены OpenAI
 */
export interface TokenUsage {
  /** Токены в промпте */
  prompt: number;
  /** Токены в ответе */
  completion: number;
  /** Всего токенов */
  total: number;
}

/**
 * Полный результат AI-обработки сертификата
 */
export interface AIProcessingResult {
  /** Успешность обработки */
  success: boolean;
  /** Извлечённые данные */
  extractedData: ExtractedCertificateData;
  /** Результат сопоставления со слушателем */
  matchResult: StudentMatchResult;
  /** Стоимость обработки в USD */
  aiCost: string;
  /** Время обработки в миллисекундах */
  processingTime: number;
  /** Использованные токены */
  tokensUsed: TokenUsage;
  /** Ошибка (если success = false) */
  error?: string;
}

// ============================================================================
// СТАТУСЫ ОБРАБОТКИ
// ============================================================================

/**
 * Статус AI-обработки
 */
export type AIProcessingStatus =
  | "pending" // Ожидает обработки
  | "processing" // В процессе обработки
  | "completed" // Успешно завершено
  | "failed"; // Ошибка

/**
 * Статус лога обработки
 */
export type ProcessingLogStatus =
  | "pending" // Ожидает обработки
  | "processing" // В процессе обработки
  | "success" // Успешно
  | "failed" // Ошибка
  | "partial"; // Частично (данные извлечены, но слушатель не найден)

// ============================================================================
// ЛОГИ ОБРАБОТКИ
// ============================================================================

/**
 * Лог AI-обработки сертификата
 */
export interface AIProcessingLog {
  id: string;
  /** ID созданного сертификата (если успешно) */
  certificateId: string | null;
  /** Оригинальное имя файла */
  originalFilename: string;
  /** Размер файла в байтах */
  fileSizeBytes: number;
  /** Время начала обработки */
  processingStartedAt: Date;
  /** Время завершения обработки */
  processingCompletedAt: Date | null;
  /** Длительность обработки в миллисекундах */
  processingDurationMs: number | null;

  // AI-данные
  /** Модель AI */
  aiModel: string;
  /** Использованные токены */
  aiTokensUsed: number | null;
  /** Стоимость в USD */
  aiCostUsd: number | null;
  /** Уровень уверенности AI */
  aiConfidence: number | null;

  // Результат
  /** Статус обработки */
  status: ProcessingLogStatus;
  /** Извлечённые данные (JSON) */
  extractedData: ExtractedCertificateData | null;
  /** Сообщение об ошибке */
  errorMessage: string | null;

  // Сопоставление со слушателем
  /** ID найденного слушателя */
  matchedStudentId: string | null;
  /** Метод сопоставления */
  matchMethod: StudentMatchMethod | null;
  /** Уверенность в совпадении */
  matchConfidence: number | null;

  // Аудит
  /** ID администратора, выполнившего импорт */
  processedBy: string;
  /** IP-адрес */
  ipAddress: string | null;

  createdAt: Date;
}

/**
 * Входные данные для создания лога
 */
export interface CreateProcessingLogInput {
  certificateId?: string;
  originalFilename: string;
  fileSizeBytes: number;
  processingStartedAt: Date;
  processingCompletedAt?: Date;
  processingDurationMs?: number;
  aiModel: string;
  aiTokensUsed?: number;
  aiCostUsd?: number;
  aiConfidence?: number;
  status: ProcessingLogStatus;
  extractedData?: ExtractedCertificateData;
  errorMessage?: string;
  matchedStudentId?: string;
  matchMethod?: StudentMatchMethod;
  matchConfidence?: number;
  processedBy: string;
  ipAddress?: string;
}

// ============================================================================
// СТАТИСТИКА AI-ИМПОРТА
// ============================================================================

/**
 * Разбивка по методам сопоставления
 */
export interface MatchMethodsBreakdown {
  /** Точное совпадение по ПИНФЛ */
  exact_pinfl: number;
  /** Точное совпадение по ФИО */
  exact_name: number;
  /** AI-поиск */
  fuzzy_ai: number;
  /** Ручной выбор */
  manual: number;
}

/**
 * Статистика AI-импорта
 */
export interface AIImportStats {
  // Производительность
  /** Всего обработано сертификатов */
  totalProcessed: number;
  /** Процент успешных обработок (0-1) */
  successRate: number;
  /** Средняя уверенность AI (0-1) */
  averageConfidence: number;
  /** Среднее время обработки в миллисекундах */
  averageProcessingTime: number;

  // Экономика
  /** Общие расходы на API в USD */
  totalCost: number;
  /** Средняя стоимость обработки в USD */
  averageCost: number;

  // Качество
  /** Разбивка по методам сопоставления */
  matchMethodsBreakdown: MatchMethodsBreakdown;

  // Проблемы
  /** Процент ошибок (0-1) */
  errorRate: number;
  /** Процент ручных корректировок (0-1) */
  manualCorrectionRate: number;
}

/**
 * Фильтры для получения логов
 */
export interface LogFilters {
  /** Номер страницы (начиная с 1) */
  page?: number;
  /** Количество записей на странице */
  limit?: number;
  /** Фильтр по статусу */
  status?: ProcessingLogStatus;
  /** Фильтр по дате (от) */
  dateFrom?: string;
  /** Фильтр по дате (до) */
  dateTo?: string;
  /** Фильтр по администратору */
  processedBy?: string;
}

/**
 * Пагинированные логи
 */
export interface PaginatedLogs {
  /** Логи */
  logs: AIProcessingLog[];
  /** Всего записей */
  total: number;
  /** Текущая страница */
  page: number;
  /** Всего страниц */
  totalPages: number;
}

// ============================================================================
// ВХОДНЫЕ ДАННЫЕ ДЛЯ API
// ============================================================================

/**
 * Входные данные для загрузки файла
 */
export interface UploadFileInput {
  /** Файл сертификата */
  file: File;
}

/**
 * Результат загрузки файла
 */
export interface UploadFileResult {
  /** ID файла */
  fileId: string;
  /** Имя файла */
  filename: string;
  /** Размер файла в байтах */
  fileSize: number;
  /** MIME-тип */
  mimeType: string;
  /** URL превью (для изображений) */
  previewUrl?: string;
}

/**
 * Входные данные для AI-анализа
 */
export interface AnalyzeFileInput {
  /** ID загруженного файла */
  fileId: string;
}

/**
 * Входные данные для подтверждения импорта
 */
export interface ConfirmImportInput {
  /** ID загруженного файла */
  fileId: string;
  /** ID выбранного слушателя */
  studentId: string;
  /** Извлечённые данные */
  extractedData: ExtractedCertificateData;
  /** Переопределённые данные (ручная корректировка) */
  overrideData?: Partial<ExtractedCertificateData>;
}

/**
 * Результат подтверждения импорта
 */
export interface ConfirmImportResult {
  /** Успешность операции */
  success: boolean;
  /** ID созданного сертификата */
  certificateId: string;
  /** Созданный сертификат */
  certificate: IssuedCertificate;
}

// ============================================================================
// РАСШИРЕНИЕ ТИПА СЕРТИФИКАТА
// ============================================================================

/**
 * Источник импорта сертификата
 */
export type ImportSource =
  | "manual" // Ручной ввод
  | "ai_scan" // AI-сканирование
  | "excel" // Импорт из Excel
  | "group_journal"; // Из журнала группы

/**
 * Расширенный сертификат с AI-данными
 */
export interface IssuedCertificateWithAI extends IssuedCertificate {
  /** Данные, извлечённые AI */
  aiExtractedData: ExtractedCertificateData | null;
  /** Уровень уверенности AI */
  aiConfidence: number | null;
  /** Статус AI-обработки */
  aiProcessingStatus: AIProcessingStatus | null;
  /** Ошибка AI-обработки */
  aiProcessingError: string | null;
  /** Источник импорта */
  importSource: ImportSource;
  /** URL оригинального отсканированного файла */
  originalFileUrl: string | null;
  /** Количество часов курса (из AI) */
  courseHoursAi: number | null;
  /** Организация, выдавшая сертификат */
  issuingOrganization: string | null;
}

// ============================================================================
// BATCH-ИМПОРТ СЕРТИФИКАТОВ
// ============================================================================

/**
 * Результат загрузки нескольких файлов
 */
export interface BatchUploadResult {
  /** Успешно загруженные файлы */
  files: UploadFileResult[];
  /** Количество успешных загрузок */
  successCount: number;
  /** Количество ошибок */
  errorCount: number;
  /** Ошибки загрузки (если есть) */
  errors?: Array<{
    filename: string;
    error: string;
  }>;
}

/**
 * Результат AI-обработки одного файла в batch
 */
export interface BatchAIProcessingResult {
  /** ID файла */
  fileId: string;
  /** Имя файла */
  filename: string;
  /** Успешность обработки */
  success: boolean;
  /** Извлечённые данные */
  extractedData: ExtractedCertificateData | null;
  /** Результат сопоставления со студентом (с топ-5) */
  matchResult: StudentMatchResult | null;
  /** Стоимость обработки в USD */
  aiCost?: string;
  /** Время обработки в миллисекундах */
  processingTime?: number;
  /** Использованные токены */
  tokensUsed?: TokenUsage;
  /** Ошибка (если success = false) */
  error?: string;
}

/**
 * Общий результат batch-анализа
 */
export interface BatchAnalysisResult {
  /** Результаты обработки каждого файла */
  results: BatchAIProcessingResult[];
  /** Количество успешных обработок */
  successCount: number;
  /** Количество ошибок */
  errorCount: number;
  /** Общая стоимость в USD */
  totalCost: string;
  /** Общее время обработки в миллисекундах */
  totalProcessingTime: number;
  /** Общее количество использованных токенов */
  totalTokensUsed: number;
}

/**
 * Элемент подтверждения для одного сертификата
 */
export interface BatchConfirmItem {
  /** ID файла */
  fileId: string;
  /** ID выбранного студента */
  studentId: string;
  /** Извлечённые данные */
  extractedData: ExtractedCertificateData;
  /** Переопределённые данные (ручная корректировка) */
  overrideData?: Partial<ExtractedCertificateData>;
}

/**
 * Входные данные для batch-подтверждения
 */
export interface BatchConfirmInput {
  /** Массив импортов для подтверждения */
  items: BatchConfirmItem[];
}

/**
 * Результат импорта одного сертификата в batch
 */
export interface BatchConfirmItemResult {
  /** ID файла */
  fileId: string;
  /** Успешность операции */
  success: boolean;
  /** ID созданного сертификата */
  certificateId?: string;
  /** Созданный сертификат */
  certificate?: IssuedCertificate;
  /** Ошибка (если success = false) */
  error?: string;
}

/**
 * Результат batch-подтверждения
 */
export interface BatchConfirmResult {
  /** Результаты для каждого сертификата */
  results: BatchConfirmItemResult[];
  /** Количество успешных импортов */
  successCount: number;
  /** Количество ошибок */
  errorCount: number;
  /** Общее время операции в миллисекундах */
  totalTime: number;
}

/**
 * Элемент для UI (файл + анализ + выбор)
 * Используется в frontend для отображения состояния каждого сертификата
 */
export interface CertificateImportItem {
  /** Загруженный файл */
  file: UploadFileResult;
  /** Результат анализа (null если ещё не анализировался) */
  analysisResult: BatchAIProcessingResult | null;
  /** Выбранный студент (null если не выбран) */
  selectedStudent: Student | null;
  /** Статус UI */
  uiStatus:
    | "uploaded"
    | "analyzing"
    | "analyzed"
    | "error"
    | "ready"
    | "confirmed";
  /** Развёрнута ли панель в UI */
  isExpanded: boolean;
}
