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
  status: 'draft' | 'issued' | 'revoked';
  created_at: Date;
  updated_at: Date;
}


// Полная информация о студенте
export interface Student {
  id: string;
  fullName: string;
  pinfl: string;
  organization: string;
  department?: string | null;
  position: string;
  certificates: StudentCertificate[];
  created_at: Date;
  updated_at: Date;
}

// Данные для создания студента
export interface CreateStudentInput {
  fullName: string;
  pinfl: string;
  organization: string;
  department?: string;
  position: string;
}

// Данные для обновления студента
export interface UpdateStudentInput {
  fullName?: string;
  pinfl?: string;
  organization?: string;
  department?: string;
  position?: string;
}

// Данные для создания сертификата
export interface CreateCertificateInput {
  studentId: string;
  courseName: string;
  issueDate: Date | string;
  certificateNumber: string;
  fileUrl?: string;
  fileUuid?: string; // UUID загруженного файла из файлового менеджера
  expiryDate?: Date | string;
}

// Данные для обновления сертификата
export interface UpdateCertificateInput {
  courseName?: string;
  issueDate?: Date | string;
  certificateNumber?: string;
  fileUrl?: string;
  fileUuid?: string; // UUID загруженного файла из файлового менеджера
  expiryDate?: Date | string;
}
