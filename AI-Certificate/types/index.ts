// Типы для сотрудников
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  position: string;
  department: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Типы для сертификатов
export interface Certificate {
  id: number;
  employeeId: number;
  certificateNumber: string;
  certificateType: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  courseName: string;
  courseHours?: number;
  status: 'active' | 'expired' | 'pending';
  fileUrl: string;
  fileName: string;
  fileType: string;
  extractedData?: ExtractedCertificateData;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Данные, извлечённые AI из сертификата
export interface ExtractedCertificateData {
  fullName?: string;
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  organization?: string;
  courseName?: string;
  courseHours?: string;
  additionalInfo?: Record<string, string>;
  confidence: number; // Уровень уверенности AI (0-1)
  rawText?: string; // Полный распознанный текст
}

// Запрос на загрузку сертификата
export interface UploadCertificateRequest {
  file: File;
  employeeId?: number; // Опционально, если известен заранее
}

// Ответ после обработки сертификата
export interface ProcessedCertificateResponse {
  success: boolean;
  certificateId?: number;
  extractedData: ExtractedCertificateData;
  suggestedEmployee?: Employee;
  message: string;
}

// Статистика по сертификатам
export interface CertificateStats {
  total: number;
  active: number;
  expired: number;
  expiringSoon: number; // Истекают в течение 30 дней
  byType: Record<string, number>;
  byDepartment: Record<string, number>;
}

// Фильтры для поиска сертификатов
export interface CertificateFilters {
  employeeId?: number;
  department?: string;
  certificateType?: string;
  status?: Certificate['status'];
  issueDateFrom?: Date;
  issueDateTo?: Date;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
  searchQuery?: string;
}
