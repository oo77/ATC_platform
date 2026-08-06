/**
 * Серверные типы для работы со студентами
 */

// Информация о сертификате студента (из issued_certificates)
export interface StudentCertificate {
  id: string;
  studentId: string;
  groupId: string;
  templateId: string;
  courseName: string;
  groupCode?: string;
  issueDate: Date;
  certificateNumber: string;
  fileUrl?: string | null;
  expiryDate?: Date | null;
  status: "draft" | "issued" | "revoked";
  created_at: Date;
  updated_at: Date;
}

// Полная информация о студенте
export interface Student {
  id: string;
  fullName: string;
  pinfl: string;
  organization: string;
  organizationId?: string | null;
  organizationUz?: string | null;
  organizationEn?: string | null;
  organizationRu?: string | null;
  department?: string | null;
  departmentUz?: string | null;
  departmentEn?: string | null;
  departmentRu?: string | null;
  position: string;
  positionUz?: string | null;
  positionEn?: string | null;
  positionRu?: string | null;
  birthDate?: Date | null;
  photo_base64?: string | null;
  userId?: string | null;
  certificates: StudentCertificate[];
  created_at: Date;
  updated_at: Date;
}

// Данные для создания студента
export interface CreateStudentInput {
  fullName: string;
  pinfl: string;
  organization: string;
  organizationId?: string | null;
  organizationUz?: string;
  organizationEn?: string;
  organizationRu?: string;
  department?: string;
  departmentUz?: string | null;
  departmentEn?: string | null;
  departmentRu?: string | null;
  position: string;
  positionUz?: string | null;
  positionEn?: string | null;
  positionRu?: string | null;
  birthDate?: Date | string | null;
  photo_base64?: string | null;
}

// Данные для обновления студента
export interface UpdateStudentInput {
  fullName?: string;
  pinfl?: string;
  organization?: string;
  organizationId?: string | null;
  organizationUz?: string;
  organizationEn?: string;
  organizationRu?: string;
  department?: string;
  departmentUz?: string | null;
  departmentEn?: string | null;
  departmentRu?: string | null;
  position?: string;
  positionUz?: string | null;
  positionEn?: string | null;
  positionRu?: string | null;
  birthDate?: Date | string | null;
  photo_base64?: string | null;
}

// Данные для создания сертификата
export interface CreateCertificateInput {
  studentId: string;
  courseName: string;
  issueDate: Date | string;
  certificateNumber: string;
  fileUrl?: string;
  fileUuid?: string;
  expiryDate?: Date | string;
}

// Данные для обновления сертификата
export interface UpdateCertificateInput {
  courseName?: string;
  issueDate?: Date | string;
  certificateNumber?: string;
  fileUrl?: string;
  fileUuid?: string;
  expiryDate?: Date | string;
}
