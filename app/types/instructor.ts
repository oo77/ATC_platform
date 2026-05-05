/**
 * Типы для работы с инструкторами
 */

export interface InstructorCertificate {
  name: string;
  date: string;
  fileId?: string;
  fileUrl?: string; // Optional URL for viewing
}

export interface Instructor {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: Date | string | null;
  contractInfo?: string | null;
  maxHours: number;
  usedHours?: number; // Количество отработанных часов
  isActive: boolean;
  userId?: string | null; // ID связанной учётной записи пользователя
  
  // Qualification fields
  birthDate?: string | null;
  passportData?: string | null;
  education?: string | null;
  university?: string | null;
  diploma_file_ids?: string[] | null;
  specialty?: string | null;
  academic_degree?: string | null;
  academic_rank?: string | null;
  certificates?: InstructorCertificate[] | null;
  languages?: string[] | null;
  photo_base64?: string | null;
  additional_files?: string[] | null; // List of file UUIDs
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateInstructorInput {
  fullName: string;
  email?: string;
  phone?: string;
  hireDate?: Date | string;
  contractInfo?: string;
  maxHours?: number;
  isActive?: boolean;
  
  birthDate?: string;
  passportData?: string;
  education?: string;
  university?: string;
  diploma_file_ids?: string[];
  specialty?: string;
  academic_degree?: string;
  academic_rank?: string;
  certificates?: InstructorCertificate[];
  languages?: string[];
  photo_base64?: string;
  additional_files?: string[];
}

export interface UpdateInstructorInput {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: Date | string | null;
  contractInfo?: string | null;
  maxHours?: number;
  isActive?: boolean;
  
  birthDate?: string | null;
  passportData?: string | null;
  education?: string | null;
  university?: string | null;
  diploma_file_ids?: string[] | null;
  specialty?: string | null;
  academic_degree?: string | null;
  academic_rank?: string | null;
  certificates?: InstructorCertificate[] | null;
  languages?: string[] | null;
  photo_base64?: string | null;
  additional_files?: string[] | null;
}

export interface InstructorFilters {
  search?: string;
  isActive?: boolean;
}

export interface PaginatedInstructorsResponse {
  data: Instructor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
