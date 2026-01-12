/**
 * Типы для работы с инструкторами
 */

export interface Instructor {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: Date | string | null;
  contractInfo?: string | null;
  maxHours: number;
  isActive: boolean;
  userId?: string | null; // ID связанной учётной записи пользователя
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
}

export interface UpdateInstructorInput {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: Date | string | null;
  contractInfo?: string | null;
  maxHours?: number;
  isActive?: boolean;
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
