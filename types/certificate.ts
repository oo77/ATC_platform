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

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateFileUrl: string | null;
  originalFileUrl: string | null;
  backgroundUrl: string | null;
  variables: VariableMapping[] | null;
  qrSettings: QRSettings | null;
  numberFormat: string;
  lastNumber: number;
  isActive: boolean;
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

export interface IssueWarning {
  type: 'low_attendance' | 'missing_grades' | 'low_grade' | 'incomplete_disciplines';
  message: string;
  details?: Record<string, any>;
}

export interface IssuedCertificate {
  id: string;
  groupId: string;
  studentId: string;
  templateId: string;
  certificateNumber: string;
  issueDate: string;
  docxFileUrl: string | null;
  pdfFileUrl: string | null;
  status: IssuedCertificateStatus;
  variablesData: Record<string, string> | null;
  warnings: IssueWarning[] | null;
  overrideWarnings: boolean;
  issuedBy: string | null;
  issuedAt: string | null;
  revokedBy: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
    } | null;
    startDate: string;
    endDate: string;
  };
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
