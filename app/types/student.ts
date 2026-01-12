/**
 * Типы для работы со студентами
 */

// Информация о сертификате студента (из issued_certificates)
export interface StudentCertificate {
  id: string;
  studentId?: string;
  groupId?: string;
  templateId?: string;
  courseName: string; // Название курса
  groupCode?: string; // Код группы
  issueDate: Date | string; // Дата получения
  certificateNumber: string; // Номер сертификата
  fileUrl?: string | null; // Ссылка на файл сертификата (PDF)
  expiryDate?: Date | string | null; // Срок годности
  status?: 'draft' | 'issued' | 'revoked'; // Статус сертификата
  created_at?: Date | string;
  updated_at?: Date | string;
}


// Полная информация о студенте
export interface Student {
  id: string;
  fullName: string; // Ф.И.О (обязательно)
  pinfl: string; // ПИНФЛ (обязательно)
  organization: string; // Организация (обязательно)
  department?: string | null; // Служба/отдел (не обязательно)
  position: string; // Должность (обязательно)
  certificates: StudentCertificate[]; // История сертификатов
  created_at: Date | string;
  updated_at: Date | string;
}

// Данные для создания студента
export interface CreateStudentData {
  fullName: string;
  pinfl: string;
  organization: string;
  department?: string;
  position: string;
}

// Данные для обновления студента
export interface UpdateStudentData {
  fullName?: string;
  pinfl?: string;
  organization?: string;
  department?: string;
  position?: string;
}

// Данные для создания сертификата
export interface CreateCertificateData {
  studentId: string;
  courseName: string;
  issueDate: Date | string;
  certificateNumber: string;
  fileUrl?: string;
  fileUuid?: string; // UUID загруженного файла из файлового менеджера
  expiryDate?: Date | string;
}

// Данные для обновления сертификата
export interface UpdateCertificateData {
  courseName?: string;
  issueDate?: Date | string;
  certificateNumber?: string;
  fileUrl?: string;
  fileUuid?: string; // UUID загруженного файла из файлового менеджера
  expiryDate?: Date | string;
}

// Ответ API для списка студентов
export interface StudentsListResponse {
  success: boolean;
  students: Student[];
  total: number;
}

// Ответ API для одного студента
export interface StudentResponse {
  success: boolean;
  student: Student;
}

// Ответ при ошибке
export interface StudentErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
