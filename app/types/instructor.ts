/**
 * Типы для работы с инструкторами
 */

export interface InstructorCertificate {
  name: string;
  date: string;
  certificate_number?: string;
  fileId?: string;
  fileUrl?: string; // Optional URL for viewing
}

export interface EducationEntry {
  education: string;
  university: string;
  specialty: string;
  diploma_series?: string;
  diploma_number?: string;
  date_start?: string;
  date_end?: string;
  diploma_file_ids?: string[] | null;
}

export interface WorkExperienceEntry {
  employer: string;
  position: string;
  period: string;
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
  education?: string | null; // Keep for legacy if needed, or remove
  university?: string | null;
  diploma_file_ids?: string[] | null;
  specialty?: string | null;
  academic_degree?: string | null;
  academic_rank?: string | null;
  education_history?: EducationEntry[] | null; // New field for multiple entries
  work_experience?: WorkExperienceEntry[] | null; // New field for work history
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
  education_history?: EducationEntry[];
  work_experience?: WorkExperienceEntry[];
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
  education_history?: EducationEntry[] | null;
  work_experience?: WorkExperienceEntry[] | null;
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
