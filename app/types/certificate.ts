/**
 * Типы для системы сертификатов (клиентская часть)
 */

// ============================================================================
// ШАБЛОНЫ СЕРТИФИКАТОВ
// ============================================================================

export type VariableSource =
  | 'student.fullName'
  | 'student.shortName'
  | 'student.lastName'
  | 'student.firstName'
  | 'student.middleName'
  | 'student.organization'
  | 'student.position'
  | 'student.department'
  | 'student.pinfl'
  | 'course.name'
  | 'course.shortName'
  | 'course.code'
  | 'course.totalHours'
  | 'course.description'
  | 'group.code'
  | 'group.startDate'
  | 'group.endDate'
  | 'group.classroom'
  | 'certificate.number'
  | 'certificate.issueDate'
  | 'certificate.issueDateFormatted'
  | 'custom';

export interface VariableMapping {
  placeholder: string;
  source: VariableSource;
  customValue?: string;
  dateFormat?: string;
}

export interface QRSettings {
  enabled: boolean;
  x: number;
  y: number;
  size: number;
  color?: string;
  backgroundColor?: string;
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
  /** Цвет заливки фона (опционально, transparent по умолчанию) */
  backgroundColor?: string;
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
  /** Цвет заливки фона (опционально, transparent по умолчанию) */
  backgroundColor?: string;
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

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateFileUrl: string | null;
  originalFileUrl: string | null;
  variables: VariableMapping[] | null;
  qrSettings: QRSettings | null;
  numberFormat: string;
  lastNumber: number;
  isActive: boolean;
  // Поля визуального редактора
  templateData: CertificateTemplateData | null;
  layout: TemplateLayout | null;
  backgroundUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VariableSourceOption {
  value: string;
  label: string;
  group: string;
}

// ============================================================================
// ВЫДАННЫЕ СЕРТИФИКАТЫ
// ============================================================================

export type IssuedCertificateStatus = 'draft' | 'issued' | 'revoked';

/**
 * Источник создания сертификата
 */
export type CertificateSourceType = 'group_journal' | 'manual' | 'import';

export interface IssueWarning {
  type: 'low_attendance' | 'missing_grades' | 'low_grade' | 'incomplete_disciplines';
  message: string;
  details?: Record<string, any>;
}

export interface IssuedCertificate {
  id: string;
  groupId: string | null;       // NULL для standalone сертификатов
  studentId: string;
  templateId: string | null;    // NULL для standalone сертификатов
  certificateNumber: string;
  issueDate: string;

  // Standalone данные о курсе (заполняются при source_type = 'manual' | 'import')
  courseName: string | null;
  courseCode: string | null;
  courseHours: number | null;

  // Standalone данные о группе (опционально)
  groupCode: string | null;
  groupStartDate: string | null;
  groupEndDate: string | null;

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
  expiryDate: string | null;

  // Telegram уведомления
  isSentViaTelegram: boolean;
  sentAt: string | null;

  // Аудит
  issuedBy: string | null;
  issuedAt: string | null;
  revokedBy: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  notes: string | null;

  // Legacy
  legacyId: string | null;

  createdAt: string;
  updatedAt: string;

  // Связанные данные (опционально)
  student?: {
    id: string;
    fullName: string;
    organization: string;
    position: string;
  };
}

export interface StudentEligibility {
  studentId: string;
  studentName: string;
  isEligible: boolean;
  warnings: IssueWarning[];
  attendancePercent: number;
  completedDisciplines: number;
  totalDisciplines: number;
  averageGrade: number | null;
  hasCertificate: boolean;
  certificateStatus?: IssuedCertificateStatus;
}

export interface CertificateJournalRow {
  student: {
    id: string;
    fullName: string;
    organization: string;
    position: string;
  };
  disciplines: {
    disciplineId: string;
    disciplineName: string;
    attendancePercent: number;
    attendedHours: number;
    totalHours: number;
    finalGrade: number | null;
    gradeStatus: 'not_graded' | 'passed' | 'failed';
  }[];
  totalAttendancePercent: number;
  totalAttendedHours: number;
  totalHours: number;
  averageGrade: number | null;
  eligibility: StudentEligibility;
  certificate: IssuedCertificate | null;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface TemplatesListResponse {
  success: boolean;
  templates: CertificateTemplate[];
  total: number;
}

export interface TemplateResponse {
  success: boolean;
  template: CertificateTemplate;
  message?: string;
}

export interface UploadTemplateResponse {
  success: boolean;
  message: string;
  variables: string[];
  availableSources: VariableSourceOption[];
  fileUrl: string;
}

export interface CertificateJournalResponse {
  success: boolean;
  group: {
    id: string;
    code: string;
    course: {
      id: string;
      name: string;
      shortName: string;
      code: string;
      totalHours: number;
      certificateTemplateId?: string | null;
      certificateValidityMonths?: number | null;
    } | null;
    startDate: string;
    endDate: string;
  };
  /** Шаблон сертификата, привязанный к курсу */
  template: CertificateTemplate | null;
  journal: CertificateJournalRow[];
  stats: {
    totalStudents: number;
    eligible: number;
    withWarnings: number;
    issued: number;
    revoked: number;
  };
}

export interface IssueCertificatesResponse {
  success: boolean;
  message: string;
  results: {
    studentId: string;
    studentName: string;
    success: boolean;
    certificateId?: string;
    certificateNumber?: string;
    warnings?: IssueWarning[];
    error?: string;
  }[];
  stats: {
    total: number;
    success: number;
    failed: number;
  };
}
