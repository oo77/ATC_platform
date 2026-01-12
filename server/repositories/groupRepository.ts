/**
 * Репозиторий для работы с учебными группами в MySQL
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

/**
 * Форматирует дату в строку YYYY-MM-DD без сдвига временной зоны
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface StudyGroup {
  id: string;
  code: string;
  courseId: string;
  startDate: Date | string;
  endDate: Date | string;
  classroom: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  course?: Course | null;
  students?: GroupStudent[];
  studentCount?: number;
}

export interface Course {
  id: string;
  name: string;
  shortName: string;
  code: string;
  totalHours: number;
  certificateTemplateId?: string | null;
  certificateValidityMonths?: number | null;
}

export interface GroupStudent {
  id: string;
  groupId: string;
  studentId: string;
  enrolledAt: Date;
  student?: Student;
}

export interface Student {
  id: string;
  fullName: string;
  pinfl: string;
  organization: string;
  department: string | null;
  position: string;
}

export interface StudentConflict {
  studentId: string;
  studentName: string;
  conflictGroupId: string;
  conflictGroupCode: string;
  conflictStartDate: Date;
  conflictEndDate: Date;
}

export interface GroupFilters {
  search?: string;
  courseId?: string;
  isActive?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  groupIds?: string[]; // Для фильтрации по конкретным ID групп (TEACHER)
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  filters?: GroupFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateGroupInput {
  code: string;
  courseId: string;
  startDate: string;
  endDate: string;
  classroom?: string;
  description?: string;
  isActive?: boolean;
  studentIds?: string[];
}

export interface UpdateGroupInput {
  code?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  classroom?: string | null;
  description?: string | null;
  isActive?: boolean;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface StudyGroupRow extends RowDataPacket {
  id: string;
  code: string;
  course_id: string;
  start_date: Date;
  end_date: Date;
  classroom: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  course_name?: string;
  course_short_name?: string;
  course_code?: string;
  course_total_hours?: number;
  course_certificate_template_id?: string | null;
  course_certificate_validity_months?: number | null;
  student_count?: number;
}

interface GroupStudentRow extends RowDataPacket {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: Date;
  // Joined fields
  student_full_name?: string;
  student_pinfl?: string;
  student_organization?: string;
  student_department?: string | null;
  student_position?: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface ConflictRow extends RowDataPacket {
  student_id: string;
  student_name: string;
  group_id: string;
  group_code: string;
  start_date: Date;
  end_date: Date;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToGroup(row: StudyGroupRow): StudyGroup {
  const group: StudyGroup = {
    id: row.id,
    code: row.code,
    courseId: row.course_id,
    // Форматируем даты как строки YYYY-MM-DD для избежания сдвига при сериализации
    startDate: formatDateLocal(row.start_date),
    endDate: formatDateLocal(row.end_date),
    classroom: row.classroom,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.course_name) {
    group.course = {
      id: row.course_id,
      name: row.course_name,
      shortName: row.course_short_name || '',
      code: row.course_code || '',
      totalHours: row.course_total_hours || 0,
      certificateTemplateId: row.course_certificate_template_id || null,
      certificateValidityMonths: row.course_certificate_validity_months || null,
    };
  }

  if (row.student_count !== undefined) {
    group.studentCount = row.student_count;
  }

  return group;
}

function mapRowToGroupStudent(row: GroupStudentRow): GroupStudent {
  const gs: GroupStudent = {
    id: row.id,
    groupId: row.group_id,
    studentId: row.student_id,
    enrolledAt: row.enrolled_at,
  };

  if (row.student_full_name) {
    gs.student = {
      id: row.student_id,
      fullName: row.student_full_name,
      pinfl: row.student_pinfl || '',
      organization: row.student_organization || '',
      department: row.student_department || null,
      position: row.student_position || '',
    };
  }

  return gs;
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить группы с пагинацией и фильтрами
 */
export async function getGroups(params: PaginationParams = {}): Promise<PaginatedResult<StudyGroup>> {
  const { page = 1, limit = 10, filters = {} } = params;

  const conditions: string[] = [];
  const queryParams: any[] = [];

  // Поиск по коду или описанию
  if (filters.search) {
    conditions.push('(sg.code LIKE ? OR sg.description LIKE ? OR c.name LIKE ?)');
    const searchPattern = `%${filters.search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  // Фильтр по курсу
  if (filters.courseId) {
    conditions.push('sg.course_id = ?');
    queryParams.push(filters.courseId);
  }

  // Фильтр по статусу
  if (filters.isActive !== undefined) {
    conditions.push('sg.is_active = ?');
    queryParams.push(filters.isActive);
  }

  // Фильтр по дате начала (от)
  if (filters.startDateFrom) {
    conditions.push('sg.start_date >= ?');
    queryParams.push(filters.startDateFrom);
  }

  // Фильтр по дате начала (до)
  if (filters.startDateTo) {
    conditions.push('sg.start_date <= ?');
    queryParams.push(filters.startDateTo);
  }

  // Фильтр по конкретным ID групп (для TEACHER)
  if (filters.groupIds && filters.groupIds.length > 0) {
    const placeholders = filters.groupIds.map(() => '?').join(', ');
    conditions.push(`sg.id IN (${placeholders})`);
    queryParams.push(...filters.groupIds);
  } else if (filters.groupIds && filters.groupIds.length === 0) {
    // Если передан пустой массив — возвращаем пустой результат
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Получаем общее количество
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM study_groups sg
    LEFT JOIN courses c ON sg.course_id = c.id
    ${whereClause}
  `;
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Получаем данные с пагинацией
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      sg.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      c.certificate_template_id as course_certificate_template_id,
      c.certificate_validity_months as course_certificate_validity_months,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = sg.id) as student_count
    FROM study_groups sg
    LEFT JOIN courses c ON sg.course_id = c.id
    ${whereClause}
    ORDER BY sg.start_date DESC, sg.code ASC
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery<StudyGroupRow[]>(dataQuery, dataParams);

  return {
    data: rows.map(mapRowToGroup),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получить группу по ID с курсом и слушателями
 */
export async function getGroupById(id: string): Promise<StudyGroup | null> {
  const rows = await executeQuery<StudyGroupRow[]>(
    `SELECT 
      sg.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      c.certificate_template_id as course_certificate_template_id,
      c.certificate_validity_months as course_certificate_validity_months,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = sg.id) as student_count
    FROM study_groups sg
    LEFT JOIN courses c ON sg.course_id = c.id
    WHERE sg.id = ?
    LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const group = mapRowToGroup(rows[0]);

  // Загружаем слушателей
  const studentRows = await executeQuery<GroupStudentRow[]>(
    `SELECT 
      sgs.*,
      s.full_name as student_full_name,
      s.pinfl as student_pinfl,
      s.organization as student_organization,
      s.department as student_department,
      s.position as student_position
    FROM study_group_students sgs
    JOIN students s ON sgs.student_id = s.id
    WHERE sgs.group_id = ?
    ORDER BY s.full_name`,
    [id]
  );

  group.students = studentRows.map(mapRowToGroupStudent);

  return group;
}

/**
 * Проверить уникальность кода группы
 */
export async function groupCodeExists(code: string, excludeId?: string): Promise<boolean> {
  let query = 'SELECT 1 FROM study_groups WHERE code = ?';
  const params: any[] = [code];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  query += ' LIMIT 1';
  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

/**
 * Проверить существование курса
 */
export async function courseExists(courseId: string): Promise<boolean> {
  const rows = await executeQuery<RowDataPacket[]>(
    'SELECT 1 FROM courses WHERE id = ? LIMIT 1',
    [courseId]
  );
  return rows.length > 0;
}

/**
 * Создать новую группу
 */
export async function createGroup(data: CreateGroupInput): Promise<StudyGroup> {
  const id = uuidv4();

  await executeTransaction(async (connection: PoolConnection) => {
    // Создаём группу
    await connection.execute(
      `INSERT INTO study_groups (id, code, course_id, start_date, end_date, classroom, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.code,
        data.courseId,
        data.startDate,
        data.endDate,
        data.classroom || null,
        data.description || null,
        data.isActive !== false,
      ]
    );

    // Добавляем слушателей, если указаны
    if (data.studentIds && data.studentIds.length > 0) {
      for (const studentId of data.studentIds) {
        const gsId = uuidv4();
        await connection.execute(
          `INSERT INTO study_group_students (id, group_id, student_id)
           VALUES (?, ?, ?)`,
          [gsId, id, studentId]
        );
      }
    }
  });

  const group = await getGroupById(id);
  if (!group) {
    throw new Error('Failed to create group');
  }

  return group;
}

/**
 * Обновить группу
 */
export async function updateGroup(id: string, data: UpdateGroupInput): Promise<StudyGroup | null> {
  const existing = await getGroupById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.code !== undefined) {
    updates.push('code = ?');
    params.push(data.code);
  }
  if (data.courseId !== undefined) {
    updates.push('course_id = ?');
    params.push(data.courseId);
  }
  if (data.startDate !== undefined) {
    updates.push('start_date = ?');
    params.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    updates.push('end_date = ?');
    params.push(data.endDate);
  }
  if (data.classroom !== undefined) {
    updates.push('classroom = ?');
    params.push(data.classroom);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive);
  }

  if (updates.length === 0) {
    return existing;
  }

  params.push(id);

  await executeQuery(
    `UPDATE study_groups SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return getGroupById(id);
}

/**
 * Удалить группу (каскадно удаляет расписание и связи со слушателями)
 */
export async function deleteGroup(id: string): Promise<boolean> {
  return executeTransaction(async (connection: PoolConnection) => {
    // 1. Удаляем все события расписания, связанные с этой группой
    await connection.execute(
      'DELETE FROM schedule_events WHERE group_id = ?',
      [id]
    );

    // 2. Удаляем связи со слушателями (study_group_students)
    await connection.execute(
      'DELETE FROM study_group_students WHERE group_id = ?',
      [id]
    );

    // 3. Удаляем саму группу
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM study_groups WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  });
}

// ============================================================================
// УПРАВЛЕНИЕ СЛУШАТЕЛЯМИ
// ============================================================================

/**
 * Проверить конфликты дат для слушателей
 * Возвращает список конфликтов (слушатель уже в другой группе с пересекающимися датами)
 */
export async function checkStudentConflicts(
  studentIds: string[],
  startDate: string,
  endDate: string,
  excludeGroupId?: string
): Promise<StudentConflict[]> {
  if (studentIds.length === 0) {
    return [];
  }

  const placeholders = studentIds.map(() => '?').join(', ');

  let query = `
    SELECT 
      sgs.student_id,
      s.full_name as student_name,
      sg.id as group_id,
      sg.code as group_code,
      sg.start_date,
      sg.end_date
    FROM study_group_students sgs
    JOIN study_groups sg ON sgs.group_id = sg.id
    JOIN students s ON sgs.student_id = s.id
    WHERE sgs.student_id IN (${placeholders})
      AND sg.start_date <= ?
      AND sg.end_date >= ?
  `;

  const params: any[] = [...studentIds, endDate, startDate];

  if (excludeGroupId) {
    query += ' AND sg.id != ?';
    params.push(excludeGroupId);
  }

  const rows = await executeQuery<ConflictRow[]>(query, params);

  return rows.map(row => ({
    studentId: row.student_id,
    studentName: row.student_name,
    conflictGroupId: row.group_id,
    conflictGroupCode: row.group_code,
    conflictStartDate: row.start_date,
    conflictEndDate: row.end_date,
  }));
}

/**
 * Добавить слушателей в группу
 */
export async function addStudentsToGroup(
  groupId: string,
  studentIds: string[]
): Promise<{ added: string[]; alreadyInGroup: string[] }> {
  if (studentIds.length === 0) {
    return { added: [], alreadyInGroup: [] };
  }

  const added: string[] = [];
  const alreadyInGroup: string[] = [];

  await executeTransaction(async (connection: PoolConnection) => {
    for (const studentId of studentIds) {
      // Проверяем, не добавлен ли уже
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1',
        [groupId, studentId]
      );

      if (existing.length > 0) {
        alreadyInGroup.push(studentId);
        continue;
      }

      const id = uuidv4();
      await connection.execute(
        `INSERT INTO study_group_students (id, group_id, student_id)
         VALUES (?, ?, ?)`,
        [id, groupId, studentId]
      );
      added.push(studentId);
    }
  });

  return { added, alreadyInGroup };
}

/**
 * Удалить слушателя из группы
 */
export async function removeStudentFromGroup(groupId: string, studentId: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM study_group_students WHERE group_id = ? AND student_id = ?',
    [groupId, studentId]
  );

  return result.affectedRows > 0;
}

/**
 * Перевести слушателя в другую группу
 */
export async function transferStudent(
  studentId: string,
  fromGroupId: string,
  toGroupId: string
): Promise<boolean> {
  return executeTransaction(async (connection: PoolConnection) => {
    // Удаляем из текущей группы
    await connection.execute(
      'DELETE FROM study_group_students WHERE group_id = ? AND student_id = ?',
      [fromGroupId, studentId]
    );

    // Проверяем, не добавлен ли уже в целевую группу
    const [existing] = await connection.execute<RowDataPacket[]>(
      'SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1',
      [toGroupId, studentId]
    );

    if (existing.length === 0) {
      const id = uuidv4();
      await connection.execute(
        `INSERT INTO study_group_students (id, group_id, student_id)
         VALUES (?, ?, ?)`,
        [id, toGroupId, studentId]
      );
    }

    return true;
  });
}

/**
 * Получить все группы для выбора (для перемещения слушателя)
 */
export async function getGroupsForSelect(excludeGroupId?: string): Promise<Array<{ id: string; code: string; courseName: string }>> {
  let query = `
    SELECT sg.id, sg.code, c.name as course_name
    FROM study_groups sg
    JOIN courses c ON sg.course_id = c.id
    WHERE sg.is_active = true
  `;
  const params: any[] = [];

  if (excludeGroupId) {
    query += ' AND sg.id != ?';
    params.push(excludeGroupId);
  }

  query += ' ORDER BY sg.code';

  const rows = await executeQuery<RowDataPacket[]>(query, params);

  return rows.map(row => ({
    id: row.id,
    code: row.code,
    courseName: row.course_name,
  }));
}

/**
 * Получить статистику по группам
 * @param groupIds Опциональный список ID групп для фильтрации (для TEACHER)
 */
export async function getGroupsStats(groupIds?: string[]): Promise<{
  total: number;
  active: number;
  completed: number;
  totalStudents: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  // Формируем условие фильтрации по groupIds
  let groupCondition = '';
  let groupParams: string[] = [];

  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => '?').join(', ');
    groupCondition = `AND id IN (${placeholders})`;
    groupParams = groupIds;
  } else if (groupIds && groupIds.length === 0) {
    // Пустой массив — нет доступных групп
    return { total: 0, active: 0, completed: 0, totalStudents: 0 };
  }

  const [totalResult] = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM study_groups WHERE 1=1 ${groupCondition}`,
    groupParams
  );

  const [activeResult] = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM study_groups WHERE is_active = true AND end_date >= ? ${groupCondition}`,
    [today, ...groupParams]
  );

  const [completedResult] = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM study_groups WHERE end_date < ? ${groupCondition}`,
    [today, ...groupParams]
  );

  // Считаем студентов только в указанных группах
  let studentsQuery = 'SELECT COUNT(DISTINCT student_id) as total FROM study_group_students';
  let studentsParams: string[] = [];

  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => '?').join(', ');
    studentsQuery += ` WHERE group_id IN (${placeholders})`;
    studentsParams = groupIds;
  }

  const [studentsResult] = await executeQuery<CountRow[]>(studentsQuery, studentsParams);

  return {
    total: totalResult[0]?.total || 0,
    active: activeResult[0]?.total || 0,
    completed: completedResult[0]?.total || 0,
    totalStudents: studentsResult[0]?.total || 0,
  };
}
