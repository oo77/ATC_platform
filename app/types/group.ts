/**
 * Типы для учебных групп
 */

import type { Course } from './course';
import type { Student } from './student';

// ============ Учебные группы ============

export interface StudyGroup {
  id: string;
  code: string;
  courseId: string;
  course?: Course;
  startDate: string;
  endDate: string;
  classroom?: string;
  description?: string;
  isActive: boolean;
  students?: GroupStudent[];
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupStudent {
  id: string;
  groupId: string;
  studentId: string;
  student?: Student;
  enrolledAt: string;
}

// ============ Данные для создания/обновления ============

export interface CreateStudyGroupData {
  code: string;
  courseId: string;
  startDate: string;
  endDate: string;
  classroom?: string;
  description?: string;
  isActive?: boolean;
  studentIds?: string[];
}

export interface UpdateStudyGroupData {
  code?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  classroom?: string;
  description?: string;
  isActive?: boolean;
}

// ============ Фильтры и пагинация ============

export interface StudyGroupFilters {
  search?: string;
  courseId?: string;
  isActive?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface StudyGroupsListResponse {
  success: boolean;
  groups: StudyGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudyGroupResponse {
  success: boolean;
  group: StudyGroup;
}

// ============ Проверка конфликтов ============

export interface StudentConflict {
  studentId: string;
  studentName: string;
  conflictGroupId: string;
  conflictGroupCode: string;
  conflictStartDate: string;
  conflictEndDate: string;
}

export interface AddStudentsResult {
  success: boolean;
  added: string[];
  conflicts: StudentConflict[];
  message?: string;
}

export interface TransferStudentData {
  studentId: string;
  toGroupId: string;
}
