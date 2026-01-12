/**
 * Репозиторий для работы с инструкторами в MySQL
 */

import { executeQuery } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

export interface Instructor {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: Date | null;
  contractInfo?: string | null;
  maxHours: number;
  isActive: boolean;
  userId?: string | null; // ID связанной учётной записи пользователя
  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorFilters {
  search?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  filters?: InstructorFilters;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// ============================================================================
// ROW TYPES
// ============================================================================

interface InstructorRow extends RowDataPacket {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  hire_date: Date | null;
  contract_info: string | null;
  max_hours: number;
  is_active: boolean;
  user_id: string | null; // ID связанной учётной записи пользователя
  created_at: Date;
  updated_at: Date;
  discipline_count?: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

// ============================================================================
// MAPPING
// ============================================================================

function mapRowToInstructor(row: InstructorRow): Instructor & { disciplineCount?: number } {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    hireDate: row.hire_date,
    contractInfo: row.contract_info,
    maxHours: row.max_hours || 0,
    isActive: Boolean(row.is_active),
    userId: row.user_id, // ID связанной учётной записи
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    disciplineCount: row.discipline_count,
  };
}

// ============================================================================
// ОСНОВНЫЕ ОПЕРАЦИИ
// ============================================================================

export async function getAllInstructors(activeOnly = true): Promise<Instructor[]> {
  const query = activeOnly
    ? 'SELECT * FROM instructors WHERE is_active = true ORDER BY full_name'
    : 'SELECT * FROM instructors ORDER BY full_name';
  
  const rows = await executeQuery<InstructorRow[]>(query);
  return rows.map(mapRowToInstructor);
}

export async function getInstructorsPaginated(params: PaginationParams = {}): Promise<PaginatedResult<Instructor & { disciplineCount?: number }>> {
  const { page = 1, limit = 10, filters = {} } = params;
  const { search, isActive } = filters;
  
  const conditions: string[] = [];
  const queryParams: any[] = [];
  
  if (search) {
    conditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  
  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    queryParams.push(isActive);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Count
  const countResult = await executeQuery<CountRow[]>(
    `SELECT COUNT(*) as total FROM instructors ${whereClause}`,
    queryParams
  );
  const total = countResult[0]?.total || 0;
  
  // Data with discipline count
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT i.*,
           (SELECT COUNT(DISTINCT di.discipline_id) FROM discipline_instructors di WHERE di.instructor_id = i.id) as discipline_count
    FROM instructors i
    ${whereClause}
    ORDER BY i.full_name
    LIMIT ? OFFSET ?
  `;
  
  const rows = await executeQuery<InstructorRow[]>(dataQuery, [...queryParams, limit, offset]);
  
  return {
    data: rows.map(mapRowToInstructor),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getInstructorById(id: string): Promise<Instructor | null> {
  const rows = await executeQuery<InstructorRow[]>(
    'SELECT * FROM instructors WHERE id = ? LIMIT 1',
    [id]
  );
  
  return rows.length > 0 ? mapRowToInstructor(rows[0]) : null;
}

export async function instructorEmailExists(email: string, excludeId?: string): Promise<boolean> {
  if (!email) return false;
  
  let query = 'SELECT 1 FROM instructors WHERE email = ?';
  const params: any[] = [email];
  
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  
  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

export async function createInstructor(data: CreateInstructorInput): Promise<Instructor> {
  const id = uuidv4();
  const now = new Date();
  
  // Преобразуем hireDate в Date если это строка
  let hireDate: Date | null = null;
  if (data.hireDate) {
    hireDate = typeof data.hireDate === 'string' ? new Date(data.hireDate) : data.hireDate;
  }
  
  await executeQuery(
    `INSERT INTO instructors (id, full_name, email, phone, hire_date, contract_info, max_hours, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.fullName,
      data.email || null,
      data.phone || null,
      hireDate,
      data.contractInfo || null,
      data.maxHours || 0,
      data.isActive !== false,
      now,
      now
    ]
  );
  
  const instructor = await getInstructorById(id);
  if (!instructor) throw new Error('Failed to create instructor');
  
  return instructor;
}

export async function updateInstructor(id: string, data: UpdateInstructorInput): Promise<Instructor | null> {
  const existing = await getInstructorById(id);
  if (!existing) return null;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(data.fullName);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    params.push(data.email ?? null); // Преобразуем undefined в null
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?');
    params.push(data.phone ?? null); // Преобразуем undefined в null
  }
  if (data.hireDate !== undefined) {
    updates.push('hire_date = ?');
    const hireDate = data.hireDate 
      ? (typeof data.hireDate === 'string' ? new Date(data.hireDate) : data.hireDate)
      : null;
    params.push(hireDate);
  }
  if (data.contractInfo !== undefined) {
    updates.push('contract_info = ?');
    params.push(data.contractInfo ?? null); // Преобразуем undefined в null
  }
  if (data.maxHours !== undefined) {
    updates.push('max_hours = ?');
    params.push(data.maxHours ?? 0); // По умолчанию 0
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive);
  }
  
  if (updates.length === 0) return existing;
  
  params.push(id);
  await executeQuery(
    `UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return getInstructorById(id);
}

export async function deleteInstructor(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    'DELETE FROM instructors WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Связывает инструктора с пользователем (user) для авторизации
 */
export async function linkInstructorToUser(instructorId: string, userId: string): Promise<void> {
  await executeQuery(
    'UPDATE instructors SET user_id = ? WHERE id = ?',
    [userId, instructorId]
  );
}

/**
 * Получить инструктора по user_id
 */
export async function getInstructorByUserId(userId: string): Promise<Instructor | null> {
  const rows = await executeQuery<InstructorRow[]>(
    'SELECT * FROM instructors WHERE user_id = ? LIMIT 1',
    [userId]
  );
  
  return rows.length > 0 ? mapRowToInstructor(rows[0]) : null;
}

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ОПЕРАЦИИ
// ============================================================================

/**
 * Получить инструкторов по списку ID
 */
export async function getInstructorsByIds(ids: string[]): Promise<Instructor[]> {
  if (ids.length === 0) return [];
  
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await executeQuery<InstructorRow[]>(
    `SELECT * FROM instructors WHERE id IN (${placeholders}) ORDER BY full_name`,
    ids
  );
  
  return rows.map(mapRowToInstructor);
}

// ============================================================================
// СТАТИСТИКА ЧАСОВ ИНСТРУКТОРА
// ============================================================================

interface InstructorHoursRow extends RowDataPacket {
  ym: string;
  total_minutes: number;
  event_count: number;
}

interface InstructorHoursTotalRow extends RowDataPacket {
  total_minutes: number;
  event_count: number;
}

export interface InstructorHoursStats {
  maxHours: number;
  totalUsedHours: number;
  totalScheduledHours: number;
  remainingHours: number;
  usagePercentage: number;
  byMonth: Array<{
    yearMonth: string;
    year: number;
    month: number;
    monthName: string;
    usedHours: number;
    scheduledHours: number;
    eventCount: number;
  }>;
}

/**
 * Получить статистику часов инструктора
 * 
 * НОВАЯ ЛОГИКА:
 * - "Отработано" = занятия, для которых есть записи в журнале посещаемости (attendance)
 * - "Запланировано" = занятия без записей в журнале посещаемости
 */
export async function getInstructorHoursStats(instructorId: string): Promise<InstructorHoursStats | null> {
  const instructor = await getInstructorById(instructorId);
  if (!instructor) return null;
  
  console.log('[InstructorHours] Загрузка статистики для инструктора:', instructorId);
  
  const dateFormat = '%Y-%m';
  
  // ============================================================
  // ОТРАБОТАННЫЕ ЧАСЫ = занятия с записями в журнале посещаемости
  // ============================================================
  
  // По месяцам (отработанные)
  const usedByMonthRows = await executeQuery<InstructorHoursRow[]>(
    `SELECT DATE_FORMAT(se.start_time, ?) AS ym, 
            SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) AS total_minutes, 
            COUNT(DISTINCT se.id) AS event_count 
     FROM schedule_events se 
     WHERE se.instructor_id = ? 
       AND EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id) 
     GROUP BY ym 
     ORDER BY ym DESC`,
    [dateFormat, instructorId]
  );
  
  // Общие отработанные часы
  const totalUsedRows = await executeQuery<InstructorHoursTotalRow[]>(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)), 0) AS total_minutes, 
            COUNT(DISTINCT se.id) AS event_count 
     FROM schedule_events se 
     WHERE se.instructor_id = ? 
       AND EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)`,
    [instructorId]
  );
  
  console.log('[InstructorHours] Отработанных занятий:', totalUsedRows[0]?.event_count || 0);
  console.log('[InstructorHours] Отработанных минут:', totalUsedRows[0]?.total_minutes || 0);
  
  // ============================================================
  // ЗАПЛАНИРОВАННЫЕ ЧАСЫ = занятия БЕЗ записей в журнале
  // ============================================================
  
  // По месяцам (запланированные)
  const scheduledByMonthRows = await executeQuery<InstructorHoursRow[]>(
    `SELECT DATE_FORMAT(se.start_time, ?) AS ym, 
            SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) AS total_minutes, 
            COUNT(DISTINCT se.id) AS event_count 
     FROM schedule_events se 
     WHERE se.instructor_id = ? 
       AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id) 
     GROUP BY ym 
     ORDER BY ym ASC`,
    [dateFormat, instructorId]
  );
  
  // Общие запланированные часы
  const totalScheduledRows = await executeQuery<InstructorHoursTotalRow[]>(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)), 0) AS total_minutes, 
            COUNT(DISTINCT se.id) AS event_count 
     FROM schedule_events se 
     WHERE se.instructor_id = ? 
       AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)`,
    [instructorId]
  );
  
  console.log('[InstructorHours] Запланированных занятий:', totalScheduledRows[0]?.event_count || 0);
  console.log('[InstructorHours] Запланированных минут:', totalScheduledRows[0]?.total_minutes || 0);
  
  // ============================================================
  // ОБЩАЯ СТАТИСТИКА
  // ============================================================
  
  // Всего занятий (для контроля)
  const totalAllRows = await executeQuery<InstructorHoursTotalRow[]>(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) AS total_minutes, COUNT(*) AS event_count FROM schedule_events WHERE instructor_id = ?`,
    [instructorId]
  );
  
  console.log('[InstructorHours] Всего занятий:', totalAllRows[0]?.event_count || 0);
  
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  // Объединяем данные по месяцам
  const monthMap = new Map<string, {
    usedMinutes: number;
    scheduledMinutes: number;
    usedEvents: number;
    scheduledEvents: number;
  }>();
  
  for (const row of usedByMonthRows) {
    const existing = monthMap.get(row.ym) || { usedMinutes: 0, scheduledMinutes: 0, usedEvents: 0, scheduledEvents: 0 };
    existing.usedMinutes = Number(row.total_minutes);
    existing.usedEvents = Number(row.event_count);
    monthMap.set(row.ym, existing);
  }
  
  for (const row of scheduledByMonthRows) {
    const existing = monthMap.get(row.ym) || { usedMinutes: 0, scheduledMinutes: 0, usedEvents: 0, scheduledEvents: 0 };
    existing.scheduledMinutes = Number(row.total_minutes);
    existing.scheduledEvents = Number(row.event_count);
    monthMap.set(row.ym, existing);
  }
  
  // Сортируем месяцы в хронологическом порядке
  const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  const byMonth = sortedMonths.map(([yearMonth, data]) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return {
      yearMonth,
      year: year!,
      month: month!,
      monthName: monthNames[month! - 1] || '',
      usedHours: Math.round(data.usedMinutes / 45 * 10) / 10, // Академические часы (45 мин)
      scheduledHours: Math.round(data.scheduledMinutes / 45 * 10) / 10,
      eventCount: data.usedEvents + data.scheduledEvents,
    };
  });
  
  const totalUsedMinutes = Number(totalUsedRows[0]?.total_minutes || 0);
  const totalScheduledMinutes = Number(totalScheduledRows[0]?.total_minutes || 0);
  
  const totalUsedHours = Math.round(totalUsedMinutes / 45 * 10) / 10;
  const totalScheduledHours = Math.round(totalScheduledMinutes / 45 * 10) / 10;
  const totalHoursPlanned = totalUsedHours + totalScheduledHours;
  const remainingHours = Math.max(0, instructor.maxHours - totalHoursPlanned);
  const usagePercentage = instructor.maxHours > 0 
    ? Math.round((totalHoursPlanned / instructor.maxHours) * 100) 
    : 0;
  
  console.log('[InstructorHours] Результат:', {
    maxHours: instructor.maxHours,
    totalUsedHours,
    totalScheduledHours,
    totalHoursPlanned,
    remainingHours,
    usagePercentage,
    monthCount: byMonth.length
  });
  
  return {
    maxHours: instructor.maxHours,
    totalUsedHours,
    totalScheduledHours,
    remainingHours,
    usagePercentage,
    byMonth,
  };
}

/**
 * Проверить, может ли инструктор взять дополнительные часы
 * @param instructorId - ID инструктора
 * @param additionalMinutes - Дополнительные минуты (длительность нового занятия)
 * @returns { canTake: boolean, remainingHours: number, requestedHours: number, message?: string }
 */
export async function checkInstructorHoursLimit(
  instructorId: string,
  additionalMinutes: number
): Promise<{ canTake: boolean; remainingHours: number; requestedHours: number; message?: string }> {
  const stats = await getInstructorHoursStats(instructorId);
  
  if (!stats) {
    return {
      canTake: false,
      remainingHours: 0,
      requestedHours: 0,
      message: 'Инструктор не найден',
    };
  }
  
  // Если maxHours = 0, то без ограничений
  if (stats.maxHours === 0) {
    return {
      canTake: true,
      remainingHours: Infinity,
      requestedHours: Math.round(additionalMinutes / 45 * 10) / 10,
    };
  }
  
  const requestedHours = Math.round(additionalMinutes / 45 * 10) / 10;
  const canTake = requestedHours <= stats.remainingHours;
  
  return {
    canTake,
    remainingHours: stats.remainingHours,
    requestedHours,
    message: canTake 
      ? undefined 
      : `Превышен лимит часов инструктора! Доступно: ${stats.remainingHours} ч., запрашивается: ${requestedHours} ч.`,
  };
}
