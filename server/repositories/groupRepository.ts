/**
 * Репозиторий для работы с учебными группами в MySQL
 */

import { executeQuery, executeTransaction } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

interface ConflictRow extends RowDataPacket {
  student_id: string;
  student_name: string;
  group_id: string;
  group_code: string;
  start_date: Date;
  end_date: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

/**
 * Форматирует дату в строку YYYY-MM-DD без сдвига временной зоны
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
  isArchived?: boolean;
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
  isArchived?: boolean;
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
  isArchived?: boolean;
  archivedAt?: Date | null;
  archivedBy?: string | null;
}

// ============================================================================
// MAPPING FUNCTIONS & CRUD
// ============================================================================

function mapGroupRow(row: any): StudyGroup {
  return {
    id: row.id,
    code: row.code,
    courseId: row.course_id,
    startDate: row.start_date,
    endDate: row.end_date,
    classroom: row.classroom,
    description: row.description,
    isActive: Boolean(row.is_active),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    course: row.course_name
      ? {
          id: row.course_id,
          name: row.course_name,
          shortName: row.course_short_name,
          code: row.course_code,
          totalHours: row.course_total_hours,
          certificateTemplateId: row.certificate_template_id,
          certificateValidityMonths: row.certificate_validity_months,
        }
      : null,
  };
}

/**
 * Создать новую группу
 */
export async function createGroup(
  input: CreateGroupInput
): Promise<StudyGroup> {
  const id = uuidv4();
  const {
    code,
    courseId,
    startDate,
    endDate,
    classroom,
    description,
    isActive = true,
  } = input;

  await executeTransaction(async (connection) => {
    // 1. Создаем группу
    await connection.execute(
      `INSERT INTO study_groups (
        id, code, course_id, start_date, end_date, 
        classroom, description, is_active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        code,
        courseId,
        startDate,
        endDate,
        classroom || null,
        description || null,
        isActive,
      ]
    );

    // 2. Добавляем студентов, если переданы
    if (input.studentIds && input.studentIds.length > 0) {
      for (const studentId of input.studentIds) {
        const linkId = uuidv4();
        await connection.execute(
          `INSERT INTO study_group_students (id, group_id, student_id) VALUES (?, ?, ?)`,
          [linkId, id, studentId]
        );
      }
    }
  });

  const group = await getGroupById(id);
  if (!group) {
    throw new Error("Не удалось создать группу");
  }

  return group;
}

/**
 * Получить группу по ID
 */
export async function getGroupById(id: string): Promise<StudyGroup | null> {
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT 
      g.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      c.certificate_template_id,
      c.certificate_validity_months
     FROM study_groups g
     LEFT JOIN courses c ON g.course_id = c.id
     WHERE g.id = ?`,
    [id]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const group = mapGroupRow(rows[0]);

  // Загружаем студентов
  const studentRows = await executeQuery<RowDataPacket[]>(
    `SELECT 
       sgs.id as link_id,
       sgs.enrolled_at,
       s.id as student_id,
       s.full_name,
       s.pinfl,
       s.organization,
       s.department,
       s.position
     FROM study_group_students sgs
     JOIN students s ON sgs.student_id = s.id
     WHERE sgs.group_id = ?
     ORDER BY s.full_name`,
    [id]
  );

  if (studentRows && studentRows.length > 0) {
    group.students = studentRows.map((row: RowDataPacket) => ({
      id: row.link_id,
      groupId: group.id,
      studentId: row.student_id,
      enrolledAt: row.enrolled_at,
      student: {
        id: row.student_id,
        fullName: row.full_name,
        pinfl: row.pinfl,
        organization: row.organization,
        department: row.department,
        position: row.position,
      },
    }));
    group.studentCount = studentRows.length;
  } else {
    group.students = [];
    group.studentCount = 0;
  }

  return group;
}

/**
 * Обновить группу
 */
export async function updateGroup(
  id: string,
  data: UpdateGroupInput
): Promise<StudyGroup | null> {
  const existing = await getGroupById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.code !== undefined) {
    updates.push("code = ?");
    params.push(data.code);
  }
  if (data.courseId !== undefined) {
    updates.push("course_id = ?");
    params.push(data.courseId);
  }
  if (data.startDate !== undefined) {
    updates.push("start_date = ?");
    params.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    updates.push("end_date = ?");
    params.push(data.endDate);
  }
  if (data.classroom !== undefined) {
    updates.push("classroom = ?");
    params.push(data.classroom);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }
  if (data.isArchived !== undefined) {
    updates.push("is_archived = ?");
    params.push(data.isArchived);
  }
  if (data.archivedAt !== undefined) {
    updates.push("archived_at = ?");
    params.push(data.archivedAt);
  }
  if (data.archivedBy !== undefined) {
    updates.push("archived_by = ?");
    params.push(data.archivedBy);
  }

  if (updates.length === 0) {
    return existing;
  }

  params.push(id);

  await executeQuery(
    `UPDATE study_groups SET ${updates.join(", ")} WHERE id = ?`,
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
    await connection.execute("DELETE FROM schedule_events WHERE group_id = ?", [
      id,
    ]);

    // 2. Удаляем связи со слушателями (study_group_students)
    await connection.execute(
      "DELETE FROM study_group_students WHERE group_id = ?",
      [id]
    );

    // 3. Удаляем саму группу
    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM study_groups WHERE id = ?",
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

  const placeholders = studentIds.map(() => "?").join(", ");

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
    query += " AND sg.id != ?";
    params.push(excludeGroupId);
  }

  const rows = await executeQuery<ConflictRow[]>(query, params);

  return (rows || []).map((row) => ({
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
        "SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1",
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
export async function removeStudentFromGroup(
  groupId: string,
  studentId: string
): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM study_group_students WHERE group_id = ? AND student_id = ?",
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
      "DELETE FROM study_group_students WHERE group_id = ? AND student_id = ?",
      [fromGroupId, studentId]
    );

    // Проверяем, не добавлен ли уже в целевую группу
    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1",
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
export async function getGroupsForSelect(
  excludeGroupId?: string
): Promise<Array<{ id: string; code: string; courseName: string }>> {
  let query = `
    SELECT sg.id, sg.code, c.name as course_name
    FROM study_groups sg
    JOIN courses c ON sg.course_id = c.id
    WHERE sg.is_active = true
  `;
  const params: any[] = [];

  if (excludeGroupId) {
    query += " AND sg.id != ?";
    params.push(excludeGroupId);
  }

  query += " ORDER BY sg.code";

  const rows = await executeQuery<RowDataPacket[]>(query, params);

  return rows.map((row) => ({
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
  const today = new Date().toISOString().split("T")[0];

  // Формируем условие фильтрации по groupIds
  let groupCondition = "";
  let groupParams: string[] = [];

  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(", ");
    groupCondition = `AND id IN (${placeholders})`;
    groupParams = groupIds;
  } else if (groupIds && groupIds.length === 0) {
    // Пустой массив — нет доступных групп
    return { total: 0, active: 0, completed: 0, totalStudents: 0 };
  }

  const totalResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM study_groups WHERE 1=1 ${groupCondition}`,
    groupParams
  );

  const activeResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM study_groups WHERE is_active = true AND end_date >= ? ${groupCondition}`,
    [today, ...groupParams]
  );

  const completedResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM study_groups WHERE end_date < ? ${groupCondition}`,
    [today, ...groupParams]
  );

  // Считаем студентов только в указанных группах
  let studentsQuery =
    "SELECT COUNT(DISTINCT student_id) as total FROM study_group_students";
  let studentsParams: string[] = [];

  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(", ");
    studentsQuery += ` WHERE group_id IN (${placeholders})`;
    studentsParams = groupIds;
  }

  const studentsResult = await executeQuery<CountRow[]>(
    studentsQuery,
    studentsParams
  );

  return {
    total: totalResult[0]?.total || 0,
    active: activeResult[0]?.total || 0,
    completed: completedResult[0]?.total || 0,
    totalStudents: studentsResult[0]?.total || 0,
  };
}

/**
 * Получить список групп с пагинацией и фильтрацией
 */
export async function getGroups(
  params: PaginationParams
): Promise<PaginatedResult<StudyGroup>> {
  const { page = 1, limit = 10, filters = {} } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const queryParams: any[] = [];

  if (filters.search) {
    conditions.push("(g.code LIKE ? OR g.description LIKE ?)");
    queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.courseId) {
    conditions.push("g.course_id = ?");
    queryParams.push(filters.courseId);
  }

  if (filters.isActive !== undefined) {
    conditions.push("g.is_active = ?");
    queryParams.push(filters.isActive ? 1 : 0);
  }

  if (filters.isArchived !== undefined) {
    conditions.push("g.is_archived = ?");
    queryParams.push(filters.isArchived ? 1 : 0);
  }

  if (filters.startDateFrom) {
    conditions.push("g.start_date >= ?");
    queryParams.push(filters.startDateFrom);
  }

  if (filters.startDateTo) {
    conditions.push("g.start_date <= ?");
    queryParams.push(filters.startDateTo);
  }

  if (filters.groupIds && filters.groupIds.length > 0) {
    const placeholders = filters.groupIds.map(() => "?").join(", ");
    conditions.push(`g.id IN (${placeholders})`);
    queryParams.push(...filters.groupIds);
  } else if (filters.groupIds && filters.groupIds.length === 0) {
    // Если передан пустой список ID — значит доступа нет
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  // Общее количество
  let countQuery = `SELECT COUNT(*) as total FROM study_groups g`;
  if (conditions.length > 0) {
    countQuery += ` WHERE ${conditions.join(" AND ")}`;
  }
  const countResult = await executeQuery<CountRow[]>(countQuery, queryParams);
  const total = countResult[0]?.total || 0;

  // Данные
  let query = `
    SELECT 
      g.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = g.id) as student_count
    FROM study_groups g
    LEFT JOIN courses c ON g.course_id = c.id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY g.created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);

  const rows = await executeQuery<RowDataPacket[]>(query, queryParams);

  const data = (rows || []).map((row) => {
    const group = mapGroupRow(row);
    group.studentCount = row.student_count;
    return group;
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Проверить существование кода группы
 */
export async function groupCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  let query = "SELECT 1 FROM study_groups WHERE code = ?";
  const params: any[] = [code];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  query += " LIMIT 1";

  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows?.length > 0;
}

/**
 * Проверить существование курса
 */
export async function courseExists(id: string): Promise<boolean> {
  const rows = await executeQuery<RowDataPacket[]>(
    "SELECT 1 FROM courses WHERE id = ? LIMIT 1",
    [id]
  );
  return rows?.length > 0;
}
