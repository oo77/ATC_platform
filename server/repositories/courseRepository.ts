/**
 * Репозиторий для работы с курсами (учебными программами) в MySQL
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface Course {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description?: string | null;
  totalHours: number;
  certificateTemplateId?: string | null;
  certificateValidityMonths?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  certificateTemplate?: CertificateTemplate | null;
  disciplines?: Discipline[];
  disciplineCount?: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string | null;
  templateFileUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Discipline {
  id: string;
  courseId: string;
  name: string;
  description?: string | null;
  hours: number;
  theoryHours: number;
  practiceHours: number;
  assessmentHours: number;
  orderIndex: number;
  instructors?: DisciplineInstructor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplineInstructor {
  id: string;
  disciplineId: string;
  instructorId: string;
  isPrimary: boolean;
  instructor?: Instructor;
  createdAt: Date;
}

export interface Instructor {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: Date | null;
  contractInfo?: string | null;
  maxHours?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseFilters {
  search?: string;
  isActive?: boolean;
  certificateTemplateId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  filters?: CourseFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCourseInput {
  name: string;
  shortName: string;
  code: string;
  description?: string;
  certificateTemplateId?: string;
  certificateValidityMonths?: number | null;
  isActive?: boolean;
  disciplines?: CreateDisciplineInput[];
}

export interface UpdateCourseInput {
  name?: string;
  shortName?: string;
  code?: string;
  description?: string | null;
  certificateTemplateId?: string | null;
  certificateValidityMonths?: number | null;
  isActive?: boolean;
}

export interface CreateDisciplineInput {
  name: string;
  description?: string;
  theoryHours: number;
  practiceHours: number;
  assessmentHours: number;
  orderIndex?: number;
  instructorIds?: string[];
}

export interface UpdateDisciplineInput {
  id?: string;
  name?: string;
  description?: string | null;
  theoryHours?: number;
  practiceHours?: number;
  assessmentHours?: number;
  orderIndex?: number;
  instructorIds?: string[];
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface CourseRow extends RowDataPacket {
  id: string;
  name: string;
  short_name: string;
  code: string;
  description: string | null;
  total_hours: number;
  certificate_template_id: string | null;
  certificate_validity_months: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CertificateTemplateRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  template_file_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DisciplineRow extends RowDataPacket {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  hours: number;
  theory_hours: number;
  practice_hours: number;
  assessment_hours: number;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

interface DisciplineInstructorRow extends RowDataPacket {
  id: string;
  discipline_id: string;
  instructor_id: string;
  is_primary: boolean;
  created_at: Date;
  // Instructor joined fields
  instructor_full_name?: string;
  instructor_email?: string;
}

interface InstructorRow extends RowDataPacket {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  hire_date: Date | null;
  contract_info: string | null;
  max_hours: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
  discipline_count?: number;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    code: row.code,
    description: row.description,
    totalHours: row.total_hours,
    certificateTemplateId: row.certificate_template_id,
    certificateValidityMonths: row.certificate_validity_months,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCertificateTemplate(row: CertificateTemplateRow): CertificateTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateFileUrl: row.template_file_url,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToDiscipline(row: DisciplineRow): Discipline {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    description: row.description,
    hours: row.hours,
    theoryHours: row.theory_hours,
    practiceHours: row.practice_hours,
    assessmentHours: row.assessment_hours,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToInstructor(row: InstructorRow): Instructor {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    hireDate: row.hire_date,
    contractInfo: row.contract_info,
    maxHours: row.max_hours,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// CERTIFICATE TEMPLATES
// ============================================================================

export async function getAllCertificateTemplates(): Promise<CertificateTemplate[]> {
  const rows = await executeQuery<CertificateTemplateRow[]>(
    'SELECT * FROM certificate_templates WHERE is_active = true ORDER BY name'
  );
  return rows.map(mapRowToCertificateTemplate);
}

export async function getCertificateTemplateById(id: string): Promise<CertificateTemplate | null> {
  const rows = await executeQuery<CertificateTemplateRow[]>(
    'SELECT * FROM certificate_templates WHERE id = ? LIMIT 1',
    [id]
  );
  return rows.length > 0 ? mapRowToCertificateTemplate(rows[0]) : null;
}

// ============================================================================
// DISCIPLINES
// ============================================================================

async function getDisciplinesByCourseId(courseId: string): Promise<Discipline[]> {
  const rows = await executeQuery<DisciplineRow[]>(
    'SELECT * FROM disciplines WHERE course_id = ? ORDER BY order_index, name',
    [courseId]
  );
  
  if (rows.length === 0) return [];
  
  // Загружаем инструкторов для всех дисциплин
  const disciplineIds = rows.map(r => r.id);
  const instructorsMap = await getDisciplineInstructors(disciplineIds);
  
  return rows.map(row => ({
    ...mapRowToDiscipline(row),
    instructors: instructorsMap.get(row.id) || [],
  }));
}

async function getDisciplineInstructors(disciplineIds: string[]): Promise<Map<string, DisciplineInstructor[]>> {
  if (disciplineIds.length === 0) return new Map();
  
  const placeholders = disciplineIds.map(() => '?').join(', ');
  const rows = await executeQuery<DisciplineInstructorRow[]>(
    `SELECT di.*, i.full_name as instructor_full_name, i.email as instructor_email
     FROM discipline_instructors di
     LEFT JOIN instructors i ON di.instructor_id = i.id
     WHERE di.discipline_id IN (${placeholders})`,
    disciplineIds
  );
  
  const result = new Map<string, DisciplineInstructor[]>();
  
  for (const row of rows) {
    const instructor: DisciplineInstructor = {
      id: row.id,
      disciplineId: row.discipline_id,
      instructorId: row.instructor_id,
      isPrimary: Boolean(row.is_primary),
      createdAt: row.created_at,
      instructor: row.instructor_full_name ? {
        id: row.instructor_id,
        fullName: row.instructor_full_name,
        email: row.instructor_email || null,
        phone: null,
        isActive: true,
        createdAt: row.created_at,
        updatedAt: row.created_at,
      } : undefined,
    };
    
    const existing = result.get(row.discipline_id) || [];
    existing.push(instructor);
    result.set(row.discipline_id, existing);
  }
  
  return result;
}

// ============================================================================
// COURSES - ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

export async function getCoursesPaginated(params: PaginationParams = {}): Promise<PaginatedResult<Course>> {
  const { page = 1, limit = 10, filters = {} } = params;
  const { search, isActive, certificateTemplateId } = filters;
  
  const conditions: string[] = [];
  const queryParams: any[] = [];
  
  if (search) {
    conditions.push('(name LIKE ? OR short_name LIKE ? OR code LIKE ? OR description LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    queryParams.push(isActive);
  }
  
  if (certificateTemplateId) {
    conditions.push('certificate_template_id = ?');
    queryParams.push(certificateTemplateId);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Count
  const countResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM courses ${whereClause}`,
    queryParams
  );
  const total = countResult[0]?.total || 0;
  
  // Data with discipline count
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT c.*, 
           (SELECT COUNT(*) FROM disciplines d WHERE d.course_id = c.id) as discipline_count
    FROM courses c
    ${whereClause}
    ORDER BY c.name
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery<(CourseRow & { discipline_count: number })[]>(
    dataQuery,
    [...queryParams, limit, offset]
  );
  
  // Load certificate templates
  const templateIds = [...new Set(rows.filter(r => r.certificate_template_id).map(r => r.certificate_template_id!))];
  const templatesMap = new Map<string, CertificateTemplate>();
  
  if (templateIds.length > 0) {
    const placeholders = templateIds.map(() => '?').join(', ');
    const templateRows = await executeQuery<CertificateTemplateRow[]>(
      `SELECT * FROM certificate_templates WHERE id IN (${placeholders})`,
      templateIds
    );
    for (const row of templateRows) {
      templatesMap.set(row.id, mapRowToCertificateTemplate(row));
    }
  }
  
  const courses: Course[] = rows.map(row => ({
    ...mapRowToCourse(row),
    disciplineCount: row.discipline_count,
    certificateTemplate: row.certificate_template_id ? templatesMap.get(row.certificate_template_id) : undefined,
  }));
  
  return {
    data: courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCourseById(id: string, includeDisciplines = true): Promise<Course | null> {
  const rows = await executeQuery<CourseRow[]>(
    'SELECT * FROM courses WHERE id = ? LIMIT 1',
    [id]
  );
  
  if (rows.length === 0) return null;
  
  const course = mapRowToCourse(rows[0]);
  
  // Load certificate template
  if (course.certificateTemplateId) {
    course.certificateTemplate = await getCertificateTemplateById(course.certificateTemplateId) || undefined;
  }
  
  // Load disciplines
  if (includeDisciplines) {
    course.disciplines = await getDisciplinesByCourseId(id);
  }
  
  return course;
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  const rows = await executeQuery<CourseRow[]>(
    'SELECT * FROM courses WHERE code = ? LIMIT 1',
    [code]
  );
  
  return rows.length > 0 ? mapRowToCourse(rows[0]) : null;
}

export async function courseCodeExists(code: string, excludeId?: string): Promise<boolean> {
  let query = 'SELECT 1 FROM courses WHERE code = ?';
  const params: any[] = [code];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

export async function createCourse(data: CreateCourseInput): Promise<Course> {
  const id = uuidv4();
  const now = new Date();
  
  // Подсчитываем общее количество часов из дисциплин
  const totalHours = data.disciplines?.reduce((sum, d) => sum + d.theoryHours + d.practiceHours + d.assessmentHours, 0) || 0;
  
  await executeTransaction(async (connection: PoolConnection) => {
    // Создаём курс
    await connection.execute(
      `INSERT INTO courses (id, name, short_name, code, description, total_hours, certificate_template_id, certificate_validity_months, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.shortName.toUpperCase(),
        data.code,
        data.description || null,
        totalHours,
        data.certificateTemplateId || null,
        data.certificateValidityMonths ?? null, // null = бессрочный сертификат
        data.isActive !== false,
        now,
        now
      ]
    );
    
    // Создаём дисциплины
    if (data.disciplines && data.disciplines.length > 0) {
      for (let i = 0; i < data.disciplines.length; i++) {
        const discipline = data.disciplines[i];
        const disciplineId = uuidv4();
        
        await connection.execute(
          `INSERT INTO disciplines (id, course_id, name, description, theory_hours, practice_hours, assessment_hours, order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            disciplineId,
            id,
            discipline.name,
            discipline.description || null,
            discipline.theoryHours,
            discipline.practiceHours,
            discipline.assessmentHours,
            discipline.orderIndex ?? i,
            now,
            now
          ]
        );
        
        // Привязываем инструкторов
        if (discipline.instructorIds && discipline.instructorIds.length > 0) {
          for (let j = 0; j < discipline.instructorIds.length; j++) {
            const diId = uuidv4();
            await connection.execute(
              `INSERT INTO discipline_instructors (id, discipline_id, instructor_id, is_primary, created_at)
               VALUES (?, ?, ?, ?, ?)`,
              [diId, disciplineId, discipline.instructorIds[j], j === 0, now]
            );
          }
        }
      }
    }
  });
  
  const course = await getCourseById(id);
  if (!course) throw new Error('Failed to create course');
  
  return course;
}

export async function updateCourse(id: string, data: UpdateCourseInput): Promise<Course | null> {
  const existing = await getCourseById(id, false);
  if (!existing) return null;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.shortName !== undefined) {
    updates.push('short_name = ?');
    params.push(data.shortName.toUpperCase());
  }
  if (data.code !== undefined) {
    updates.push('code = ?');
    params.push(data.code);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.certificateTemplateId !== undefined) {
    updates.push('certificate_template_id = ?');
    params.push(data.certificateTemplateId);
  }
  if (data.certificateValidityMonths !== undefined) {
    updates.push('certificate_validity_months = ?');
    params.push(data.certificateValidityMonths);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive);
  }
  
  if (updates.length === 0) return existing;
  
  params.push(id);
  await executeQuery(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return getCourseById(id);
}

export async function deleteCourse(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM courses WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

// ============================================================================
// DISCIPLINE MANAGEMENT
// ============================================================================

export async function addDisciplineToCourse(courseId: string, data: CreateDisciplineInput): Promise<Discipline | null> {
  const course = await getCourseById(courseId, false);
  if (!course) return null;
  
  const id = uuidv4();
  const now = new Date();
  
  await executeTransaction(async (connection: PoolConnection) => {
    // Получаем максимальный order_index
    const [maxOrderRows] = await connection.execute<(RowDataPacket & { max_order: number })[]>(
      'SELECT COALESCE(MAX(order_index), -1) as max_order FROM disciplines WHERE course_id = ?',
      [courseId]
    );
    const nextOrder = (maxOrderRows[0]?.max_order ?? -1) + 1;
    
    await connection.execute(
      `INSERT INTO disciplines (id, course_id, name, description, theory_hours, practice_hours, assessment_hours, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, courseId, data.name, data.description || null, data.theoryHours, data.practiceHours, data.assessmentHours, data.orderIndex ?? nextOrder, now, now]
    );
    
    // Привязываем инструкторов
    if (data.instructorIds && data.instructorIds.length > 0) {
      for (let i = 0; i < data.instructorIds.length; i++) {
        const diId = uuidv4();
        await connection.execute(
          `INSERT INTO discipline_instructors (id, discipline_id, instructor_id, is_primary, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [diId, id, data.instructorIds[i], i === 0, now]
        );
      }
    }
    
    // Обновляем total_hours курса
    await connection.execute(
      `UPDATE courses SET total_hours = (SELECT COALESCE(SUM(hours), 0) FROM disciplines WHERE course_id = ?) WHERE id = ?`,
      [courseId, courseId]
    );
  });
  
  // Возвращаем созданную дисциплину
  const disciplines = await getDisciplinesByCourseId(courseId);
  return disciplines.find(d => d.id === id) || null;
}

export async function updateDiscipline(disciplineId: string, data: UpdateDisciplineInput): Promise<Discipline | null> {
  const rows = await executeQuery<DisciplineRow[]>(
    'SELECT * FROM disciplines WHERE id = ? LIMIT 1',
    [disciplineId]
  );
  
  if (rows.length === 0) return null;
  
  const courseId = rows[0].course_id;
  
  await executeTransaction(async (connection: PoolConnection) => {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.theoryHours !== undefined) {
      updates.push('theory_hours = ?');
      params.push(data.theoryHours);
    }
    if (data.practiceHours !== undefined) {
      updates.push('practice_hours = ?');
      params.push(data.practiceHours);
    }
    if (data.assessmentHours !== undefined) {
      updates.push('assessment_hours = ?');
      params.push(data.assessmentHours);
    }
    if (data.orderIndex !== undefined) {
      updates.push('order_index = ?');
      params.push(data.orderIndex);
    }
    
    if (updates.length > 0) {
      params.push(disciplineId);
      await connection.execute(
        `UPDATE disciplines SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
    
    // Обновляем инструкторов если указаны
    if (data.instructorIds !== undefined) {
      // Удаляем старые связи
      await connection.execute(
        'DELETE FROM discipline_instructors WHERE discipline_id = ?',
        [disciplineId]
      );
      
      // Добавляем новые
      const now = new Date();
      for (let i = 0; i < data.instructorIds.length; i++) {
        const diId = uuidv4();
        await connection.execute(
          `INSERT INTO discipline_instructors (id, discipline_id, instructor_id, is_primary, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [diId, disciplineId, data.instructorIds[i], i === 0, now]
        );
      }
    }
    
    // Обновляем total_hours курса
    await connection.execute(
      `UPDATE courses SET total_hours = (SELECT COALESCE(SUM(hours), 0) FROM disciplines WHERE course_id = ?) WHERE id = ?`,
      [courseId, courseId]
    );
  });
  
  const disciplines = await getDisciplinesByCourseId(courseId);
  return disciplines.find(d => d.id === disciplineId) || null;
}

export async function deleteDiscipline(disciplineId: string): Promise<boolean> {
  // Получаем course_id перед удалением
  const rows = await executeQuery<DisciplineRow[]>(
    'SELECT course_id FROM disciplines WHERE id = ? LIMIT 1',
    [disciplineId]
  );
  
  if (rows.length === 0) return false;
  
  const courseId = rows[0].course_id;
  
  await executeTransaction(async (connection: PoolConnection) => {
    await connection.execute('DELETE FROM disciplines WHERE id = ?', [disciplineId]);
    
    // Обновляем total_hours курса
    await connection.execute(
      `UPDATE courses SET total_hours = (SELECT COALESCE(SUM(hours), 0) FROM disciplines WHERE course_id = ?) WHERE id = ?`,
      [courseId, courseId]
    );
  });
  
  return true;
}
