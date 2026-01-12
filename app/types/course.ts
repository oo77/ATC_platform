/**
 * Типы для учебных программ (курсов), дисциплин и инструкторов
 */

// ============ Инструкторы ============

export interface Instructor {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  contractInfo?: string;
  maxHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstructorData {
  fullName: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  contractInfo?: string;
  maxHours?: number;
  isActive?: boolean;
}

export interface UpdateInstructorData extends Partial<CreateInstructorData> {}

// ============ Шаблоны сертификатов ============

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  templateFileUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ Дисциплины ============

export interface Discipline {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  hours: number; // Автоматически вычисляется как сумма theoryHours + practiceHours + assessmentHours
  theoryHours: number;
  practiceHours: number;
  assessmentHours: number;
  orderIndex: number;
  instructors?: DisciplineInstructor[];
  createdAt: string;
  updatedAt: string;
}

export interface DisciplineInstructor {
  id: string;
  disciplineId: string;
  instructorId: string;
  isPrimary: boolean;
  instructor?: Instructor;
  createdAt: string;
}

export interface CreateDisciplineData {
  name: string;
  description?: string;
  theoryHours: number;
  practiceHours: number;
  assessmentHours: number;
  orderIndex?: number;
  instructorIds?: string[];
}

export interface UpdateDisciplineData extends Partial<CreateDisciplineData> {}

// ============ Курсы (Учебные программы) ============

export interface Course {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description?: string;
  totalHours: number;
  certificateTemplateId?: string;
  certificateTemplate?: CertificateTemplate;
  certificateValidityMonths?: number; // Срок действия сертификата в месяцах
  isActive: boolean;
  disciplines?: Discipline[];
  disciplineCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  name: string;
  shortName: string;
  code: string;
  description?: string;
  certificateTemplateId?: string;
  certificateValidityMonths?: number; // Срок действия сертификата в месяцах
  isActive?: boolean;
  disciplines?: CreateDisciplineData[];
}

export interface UpdateCourseData extends Partial<Omit<CreateCourseData, 'disciplines'>> {
  disciplines?: (CreateDisciplineData | UpdateDisciplineData & { id?: string })[];
}

// ============ Фильтры и пагинация ============

export interface CourseFilters {
  search?: string;
  isActive?: boolean;
  certificateTemplateId?: string;
}

export interface InstructorFilters {
  search?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
