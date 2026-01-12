/**
 * @deprecated Это временное хранилище данных студентов
 * ЗАМЕЩЕНО репозиторием server/repositories/studentRepository.ts
 * 
 * Данный файл сохранён для обратной совместимости и документации.
 * Все API эндпоинты теперь используют MySQL через studentRepository.
 * 
 * НЕ ИСПОЛЬЗУЙТЕ этот файл в новом коде!
 */

import type { Student, StudentCertificate } from '../types/student';

/**
 * @deprecated Используйте studentRepository.PaginationParams
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  fullName?: string;
  pinfl?: string;
  organization?: string;
  position?: string;
  hasCertificates?: boolean;
  noCertificates?: boolean;
}

/**
 * @deprecated Используйте studentRepository.PaginatedResult
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Пустой массив - данные теперь в MySQL
const students: Student[] = [];

console.warn(
  '⚠️ [DEPRECATED] studentStorage.ts is deprecated. ' +
  'Use server/repositories/studentRepository.ts instead. ' +
  'All data is now stored in MySQL.'
);

/**
 * @deprecated Используйте studentRepository.getAllStudents()
 */
export function getAllStudents(): Student[] {
  console.warn('⚠️ getAllStudents() is deprecated. Use studentRepository.');
  return students;
}

/**
 * @deprecated Используйте studentRepository.getStudentsPaginated()
 */
export function getStudentsPaginated(params: PaginationParams = {}): PaginatedResult<Student> {
  console.warn('⚠️ getStudentsPaginated() is deprecated. Use studentRepository.');
  return {
    data: [],
    total: 0,
    page: params.page || 1,
    limit: params.limit || 10,
    totalPages: 0,
  };
}

/**
 * @deprecated Используйте studentRepository.getStudentById()
 */
export function getStudentById(id: string): Student | undefined {
  console.warn('⚠️ getStudentById() is deprecated. Use studentRepository.');
  return undefined;
}

/**
 * @deprecated Используйте studentRepository.createStudent()
 */
export function createStudent(data: Omit<Student, 'id' | 'certificates' | 'created_at' | 'updated_at'>): Student {
  console.warn('⚠️ createStudent() is deprecated. Use studentRepository.');
  throw new Error('studentStorage is deprecated. Use studentRepository instead.');
}

/**
 * @deprecated Используйте studentRepository.updateStudent()
 */
export function updateStudent(id: string, data: Partial<Omit<Student, 'id' | 'certificates' | 'created_at' | 'updated_at'>>): Student | null {
  console.warn('⚠️ updateStudent() is deprecated. Use studentRepository.');
  return null;
}

/**
 * @deprecated Используйте studentRepository.deleteStudent()
 */
export function deleteStudent(id: string): boolean {
  console.warn('⚠️ deleteStudent() is deprecated. Use studentRepository.');
  return false;
}

/**
 * @deprecated Используйте studentRepository.addCertificateToStudent()
 */
export function addCertificateToStudent(
  studentId: string,
  data: Omit<StudentCertificate, 'id' | 'studentId' | 'created_at' | 'updated_at'>
): StudentCertificate | null {
  console.warn('⚠️ addCertificateToStudent() is deprecated. Use studentRepository.');
  return null;
}

/**
 * @deprecated Используйте studentRepository.deleteCertificate()
 */
export function deleteCertificate(certificateId: string): boolean {
  console.warn('⚠️ deleteCertificate() is deprecated. Use studentRepository.');
  return false;
}

/**
 * @deprecated Используйте studentRepository.studentExistsByPinfl()
 */
export function studentExistsByPinfl(pinfl: string, excludeId?: string): boolean {
  console.warn('⚠️ studentExistsByPinfl() is deprecated. Use studentRepository.');
  return false;
}
