/**
 * Типы для системы сертификатов
 */

// ============================================================================
// ШАБЛОНЫ СЕРТИФИКАТОВ
// ============================================================================

/**
 * Источники данных для переменных шаблона
 */
export type VariableSource =
  // Данные студента
  | 'student.fullName'
  | 'student.shortName'          // Сокращённое ФИО (Иванов И.И.)
  | 'student.lastName'
  | 'student.firstName'
  | 'student.middleName'
  | 'student.organization'
  | 'student.position'
  | 'student.department'
  | 'student.pinfl'
  // Данные курса
  | 'course.name'
  | 'course.shortName'
  | 'course.code'
  | 'course.totalHours'
  | 'course.description'
  // Данные группы
  | 'group.code'
  | 'group.startDate'
  | 'group.endDate'
  | 'group.classroom'
  // Данные сертификата
  | 'certificate.number'
  | 'certificate.issueDate'
  | 'certificate.issueDateFormatted'  // "26 декабря 2025 года"
  // Кастомные
  | 'custom';

/**
 * Маппинг одной переменной
 */
export interface VariableMapping {
  /** Переменная в шаблоне, например "[ФИО]" */
  placeholder: string;
  /** Источник данных */
  source: VariableSource;
  /** Кастомное значение (если source = 'custom') */
  customValue?: string;
  /** Формат для дат (если применимо) */
  dateFormat?: string;
}

/**
 * Настройки QR-кода
 */
export interface QRSettings {
  /** Включён ли QR-код */
  enabled: boolean;
  /** Позиция X в процентах от ширины (0-100) */
  x: number;
  /** Позиция Y в процентах от высоты (0-100) */
  y: number;
  /** Размер в пикселях */
  size: number;
  /** Цвет QR-кода (hex) */
  color?: string;
  /** Цвет фона QR-кода (hex) */
  backgroundColor?: string;
}

/**
 * Шаблон сертификата
 */
export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateFileUrl: string | null;      // PDF preview или первая страница
  originalFileUrl: string | null;      // Оригинальный DOCX (для обратной совместимости)
  variables: VariableMapping[] | null;
  qrSettings: QRSettings | null;
  numberFormat: string;                // Формат номера, например "ATC{YY}_{CODE}_{NUM}"
  lastNumber: number;                  // Последний использованный номер
  isActive: boolean;
  // Новые поля для визуального редактора
  templateData: CertificateTemplateData | null;  // JSON-структура редактора
  layout: TemplateLayout | null;                  // Макет (A4_portrait, A4_landscape и т.д.)
  backgroundUrl: string | null;                   // URL фонового изображения
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Входные данные для создания шаблона
 */
export interface CreateCertificateTemplateInput {
  name: string;
  description?: string;
  numberFormat?: string;
}

/**
 * Входные данные для обновления шаблона
 */
export interface UpdateCertificateTemplateInput {
  name?: string;
  description?: string | null;
  variables?: VariableMapping[];
  qrSettings?: QRSettings;
  numberFormat?: string;
  isActive?: boolean;
  templateData?: CertificateTemplateData;
  layout?: TemplateLayout;
  backgroundUrl?: string | null;
}

// ============================================================================
// ВИЗУАЛЬНЫЙ РЕДАКТОР ШАБЛОНОВ
// ============================================================================

/**
 * Макет сертификата
 */
export type TemplateLayout =
  | 'A4_portrait'
  | 'A4_landscape'
  | 'letter_portrait'
  | 'letter_landscape';

/**
 * Размеры макетов в пикселях (при 96 DPI)
 */
export const LAYOUT_DIMENSIONS: Record<TemplateLayout, { width: number; height: number }> = {
  A4_portrait: { width: 794, height: 1123 },
  A4_landscape: { width: 1123, height: 794 },
  letter_portrait: { width: 816, height: 1056 },
  letter_landscape: { width: 1056, height: 816 },
};

/**
 * Тип фона
 */
export type BackgroundType = 'color' | 'image' | 'preset';

/**
 * Настройки фона
 */
export interface TemplateBackground {
  type: BackgroundType;
  /** HEX-цвет, URL изображения, или ID пресета */
  value: string;
}

/**
 * Базовый элемент на холсте
 */
export interface BaseElement {
  id: string;
  type: 'text' | 'variable' | 'image' | 'qr' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
}

/**
 * Элемент статического текста
 */
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  lineHeight: number;
}

/**
 * Элемент переменной (динамические данные)
 */
export interface VariableElement extends BaseElement {
  type: 'variable';
  /** Ключ переменной, например 'student.fullName' */
  variableKey: VariableSource;
  /** Отображаемый текст в редакторе */
  placeholder: string;
  /** Стили текста */
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  lineHeight: number;
}

/**
 * Режим подгонки изображения
 */
export type ImageObjectFit = 'contain' | 'cover' | 'fill';

/**
 * Элемент изображения
 */
export interface ImageElement extends BaseElement {
  type: 'image';
  /** URL или base64 */
  src: string;
  objectFit: ImageObjectFit;
  opacity: number; // 0-1
}

/**
 * Источник данных для QR-кода
 */
export type QRDataSource = 'certificate_url' | 'certificate_number' | 'custom';

/**
 * Элемент QR-кода
 */
export interface QRElement extends BaseElement {
  type: 'qr';
  /** Источник данных для QR-кода */
  dataSource: QRDataSource;
  /** Кастомные данные (если dataSource = 'custom') */
  customData?: string;
  size: number;
  color: string;
  backgroundColor: string;
}

/**
 * Тип фигуры
 */
export type ShapeType = 'rectangle' | 'circle' | 'line';

/**
 * Элемент фигуры
 */
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

/**
 * Объединённый тип элемента
 */
export type TemplateElement =
  | TextElement
  | VariableElement
  | ImageElement
  | QRElement
  | ShapeElement;

/**
 * JSON-структура шаблона редактора
 */
export interface CertificateTemplateData {
  /** Версия формата (для будущей совместимости) */
  version: string;
  /** Макет */
  layout: TemplateLayout;
  /** Ширина в пикселях */
  width: number;
  /** Высота в пикселях */
  height: number;
  /** Настройки фона */
  background: TemplateBackground;
  /** Элементы на холсте */
  elements: TemplateElement[];
}

// ============================================================================
// ВЫДАННЫЕ СЕРТИФИКАТЫ
// ============================================================================

/**
 * Статус выданного сертификата
 */
export type IssuedCertificateStatus = 'draft' | 'issued' | 'revoked';

/**
 * Источник создания сертификата
 */
export type CertificateSourceType = 'group_journal' | 'manual' | 'import';

/**
 * Предупреждение при выдаче
 */
export interface IssueWarning {
  type: 'low_attendance' | 'missing_grades' | 'low_grade' | 'incomplete_disciplines';
  message: string;
  details?: Record<string, any>;
}

/**
 * Выданный сертификат
 */
export interface IssuedCertificate {
  id: string;
  groupId: string | null;       // NULL для standalone сертификатов
  studentId: string;
  templateId: string | null;    // NULL для standalone сертификатов
  certificateNumber: string;
  issueDate: Date;

  // Standalone данные о курсе (заполняются при source_type = 'manual' | 'import')
  courseName: string | null;
  courseCode: string | null;
  courseHours: number | null;

  // Standalone данные о группе (опционально)
  groupCode: string | null;
  groupStartDate: Date | null;
  groupEndDate: Date | null;

  // Источник создания
  sourceType: CertificateSourceType;

  // Файлы
  docxFileUrl: string | null;
  pdfFileUrl: string | null;

  // Статус и данные
  status: IssuedCertificateStatus;
  variablesData: Record<string, string> | null;
  warnings: IssueWarning[] | null;
  overrideWarnings: boolean;

  // Срок действия
  expiryDate: Date | null;

  // Telegram уведомления
  isSentViaTelegram: boolean;
  sentAt: Date | null;

  // Аудит
  issuedBy: string | null;
  issuedAt: Date | null;
  revokedBy: string | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  notes: string | null;

  // Legacy
  legacyId: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Связанные данные (опционально)
  student?: {
    id: string;
    fullName: string;
    organization: string;
    position: string;
  };
  template?: CertificateTemplate;
}

/**
 * Входные данные для выдачи сертификата
 */
export interface IssueCertificateInput {
  groupId: string;
  studentId: string;
  templateId: string;
  issueDate?: string;          // Если не указана, используется текущая дата
  notes?: string;
  overrideWarnings?: boolean;  // Игнорировать предупреждения
}

/**
 * Входные данные для массовой выдачи
 */
export interface BulkIssueCertificatesInput {
  groupId: string;
  templateId: string;
  studentIds: string[];
  issueDate?: string;
  overrideWarnings?: boolean;
}

/**
 * Результат проверки студента на допуск к сертификату
 */
export interface StudentEligibility {
  studentId: string;
  studentName: string;
  isEligible: boolean;
  warnings: IssueWarning[];
  attendancePercent: number;
  completedDisciplines: number;
  totalDisciplines: number;
  averageGrade: number | null;
  hasCertificate: boolean;       // Уже выдан сертификат?
  certificateStatus?: IssuedCertificateStatus;
}

/**
 * Результат парсинга DOCX-шаблона
 */
export interface ParsedTemplate {
  /** Найденные переменные в формате [VARIABLE] */
  variables: string[];
  /** Количество страниц */
  pageCount: number;
  /** Превью первой страницы (base64 или URL) */
  previewUrl?: string;
}

// ============================================================================
// ЖУРНАЛ СЕРТИФИКАТОВ
// ============================================================================

/**
 * Строка журнала выдачи сертификатов
 */
export interface CertificateJournalRow {
  student: {
    id: string;
    fullName: string;
    organization: string;
    position: string;
  };
  /** Данные по дисциплинам */
  disciplines: {
    disciplineId: string;
    disciplineName: string;
    attendancePercent: number;
    attendedHours: number;
    totalHours: number;
    finalGrade: number | null;
    gradeStatus: 'not_graded' | 'passed' | 'failed';
  }[];
  /** Общая статистика */
  totalAttendancePercent: number;
  totalAttendedHours: number;
  totalHours: number;
  averageGrade: number | null;
  /** Допуск */
  eligibility: StudentEligibility;
  /** Выданный сертификат (если есть) */
  certificate: IssuedCertificate | null;
}
