/**
 * Репозиторий для системы допуска отметок посещаемости инструкторами
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  AttendanceMarkingStatus,
  AttendanceMarkingStatusRecord,
  AttendanceMarkingRequest,
  AttendanceSetting,
  AttendanceSettings,
  MarkingStatusFilters,
  MarkingAccessCheckResult,
  MarkingRequestStatus,
  CreateMarkingRequestInput,
  ReviewMarkingRequestInput,
  DEFAULT_ATTENDANCE_SETTINGS,
} from '../types/attendanceMarking';

// ============================================================================
// ROW TYPES
// ============================================================================

interface MarkingStatusRow extends RowDataPacket {
  id: string;
  schedule_event_id: string;
  status: AttendanceMarkingStatus;
  marked_by: string | null;
  marked_at: Date | null;
  deadline: Date;
  late_deadline: Date;
  late_reason: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  students_count: number;
  marked_count: number;
  created_at: Date;
  updated_at: Date;
  // Joined
  event_title?: string;
  event_start_time?: Date;
  event_end_time?: Date;
  event_type?: string;
  discipline_id?: string;
  group_id?: string;
  group_code?: string;
  instructor_id?: string;
  instructor_name?: string;
  marked_by_name?: string;
}

interface MarkingRequestRow extends RowDataPacket {
  id: string;
  schedule_event_id: string;
  instructor_id: string;
  reason: string;
  status: MarkingRequestStatus;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_comment: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined
  event_title?: string;
  event_start_time?: Date;
  event_end_time?: Date;
  group_code?: string;
  instructor_name?: string;
  reviewer_name?: string;
}

interface SettingRow extends RowDataPacket {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: Date;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToMarkingStatus(row: MarkingStatusRow): AttendanceMarkingStatusRecord {
  const record: AttendanceMarkingStatusRecord = {
    id: row.id,
    scheduleEventId: row.schedule_event_id,
    status: row.status,
    markedBy: row.marked_by,
    markedAt: row.marked_at,
    deadline: row.deadline,
    lateDeadline: row.late_deadline,
    lateReason: row.late_reason,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    studentsCount: Number(row.students_count),
    markedCount: Number(row.marked_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.event_title) {
    record.event = {
      id: row.schedule_event_id,
      title: row.event_title,
      startTime: row.event_start_time!,
      endTime: row.event_end_time!,
      eventType: row.event_type || 'other',
      disciplineId: row.discipline_id || null,
      groupId: row.group_id || null,
      groupCode: row.group_code || null,
      instructorId: row.instructor_id || null,
      instructorName: row.instructor_name || null,
    };
  }

  if (row.marked_by && row.marked_by_name) {
    record.markedByUser = {
      id: row.marked_by,
      fullName: row.marked_by_name,
    };
  }

  return record;
}

function mapRowToMarkingRequest(row: MarkingRequestRow): AttendanceMarkingRequest {
  const request: AttendanceMarkingRequest = {
    id: row.id,
    scheduleEventId: row.schedule_event_id,
    instructorId: row.instructor_id,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewComment: row.review_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.event_title) {
    request.event = {
      id: row.schedule_event_id,
      title: row.event_title,
      startTime: row.event_start_time!,
      endTime: row.event_end_time!,
      groupCode: row.group_code || null,
    };
  }

  if (row.instructor_name) {
    request.instructor = {
      id: row.instructor_id,
      fullName: row.instructor_name,
    };
  }

  if (row.reviewed_by && row.reviewer_name) {
    request.reviewer = {
      id: row.reviewed_by,
      fullName: row.reviewer_name,
    };
  }

  return request;
}

// ============================================================================
// НАСТРОЙКИ
// ============================================================================

/**
 * Получить все настройки системы отметок
 */
export async function getAttendanceSettings(): Promise<AttendanceSettings> {
  const rows = await executeQuery<SettingRow[]>(
    'SELECT * FROM attendance_settings'
  );

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }

  return {
    ATTENDANCE_MARK_DEADLINE_HOURS: parseInt(settings.ATTENDANCE_MARK_DEADLINE_HOURS || '24', 10),
    ATTENDANCE_EDIT_DEADLINE_HOURS: parseInt(settings.ATTENDANCE_EDIT_DEADLINE_HOURS || '72', 10),
    ATTENDANCE_LATE_MARK_ALLOWED: settings.ATTENDANCE_LATE_MARK_ALLOWED !== 'false',
    ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE: settings.ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE !== 'false',
    ATTENDANCE_REMINDER_HOURS_BEFORE: parseInt(settings.ATTENDANCE_REMINDER_HOURS_BEFORE || '2', 10),
    ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD: parseInt(settings.ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD || '48', 10),
    ATTENDANCE_AUTO_CREATE_STATUS: settings.ATTENDANCE_AUTO_CREATE_STATUS !== 'false',
  };
}

/**
 * Обновить настройку
 */
export async function updateAttendanceSetting(
  key: string,
  value: string,
  updatedBy?: string
): Promise<void> {
  await executeQuery(
    `UPDATE attendance_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?`,
    [value, updatedBy || null, key]
  );
}

// ============================================================================
// СТАТУСЫ ОТМЕТКИ
// ============================================================================

/**
 * Получить статус отметки для занятия
 */
export async function getMarkingStatusByEventId(
  scheduleEventId: string
): Promise<AttendanceMarkingStatusRecord | null> {
  const rows = await executeQuery<MarkingStatusRow[]>(
    `SELECT 
      ams.*,
      se.title as event_title,
      se.start_time as event_start_time,
      se.end_time as event_end_time,
      se.event_type,
      se.discipline_id,
      se.group_id,
      sg.code as group_code,
      se.instructor_id,
      i.full_name as instructor_name,
      u.name as marked_by_name
    FROM attendance_marking_status ams
    JOIN schedule_events se ON ams.schedule_event_id = se.id
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN users u ON ams.marked_by = u.id
    WHERE ams.schedule_event_id = ?
    LIMIT 1`,
    [scheduleEventId]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToMarkingStatus(rows[0]);
}

/**
 * Получить статусы отметки с фильтрами
 */
export async function getMarkingStatuses(
  filters: MarkingStatusFilters = {}
): Promise<AttendanceMarkingStatusRecord[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.instructorId) {
    conditions.push('se.instructor_id = ?');
    params.push(filters.instructorId);
  }

  if (filters.groupId) {
    conditions.push('se.group_id = ?');
    params.push(filters.groupId);
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const placeholders = filters.status.map(() => '?').join(', ');
      conditions.push(`ams.status IN (${placeholders})`);
      params.push(...filters.status);
    } else {
      conditions.push('ams.status = ?');
      params.push(filters.status);
    }
  }

  if (filters.dateFrom) {
    conditions.push('se.start_time >= ?');
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push('se.start_time <= ?');
    params.push(filters.dateTo);
  }

  if (filters.onlyOverdue) {
    conditions.push('ams.status = ?');
    params.push('overdue');
  }

  if (filters.onlyPending) {
    conditions.push('ams.status IN (?, ?)');
    params.push('pending', 'in_progress');
  }

  // Только прошедшие занятия
  conditions.push('se.end_time <= NOW()');

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await executeQuery<MarkingStatusRow[]>(
    `SELECT 
      ams.*,
      se.title as event_title,
      se.start_time as event_start_time,
      se.end_time as event_end_time,
      se.event_type,
      se.discipline_id,
      se.group_id,
      sg.code as group_code,
      se.instructor_id,
      i.full_name as instructor_name,
      u.name as marked_by_name
    FROM attendance_marking_status ams
    JOIN schedule_events se ON ams.schedule_event_id = se.id
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN users u ON ams.marked_by = u.id
    ${whereClause}
    ORDER BY se.end_time DESC`,
    params
  );

  return rows.map(mapRowToMarkingStatus);
}

/**
 * Получить неотмеченные занятия инструктора
 */
export async function getPendingMarkingsForInstructor(
  instructorId: string
): Promise<AttendanceMarkingStatusRecord[]> {
  return getMarkingStatuses({
    instructorId,
    onlyPending: true,
  });
}

/**
 * Получить просроченные отметки (для администраторов)
 */
export async function getOverdueMarkings(): Promise<AttendanceMarkingStatusRecord[]> {
  // Обновляем статусы на overdue, если прошёл late_deadline
  await executeQuery(
    `UPDATE attendance_marking_status 
     SET status = 'overdue' 
     WHERE status IN ('pending', 'in_progress') 
       AND late_deadline < NOW()`
  );

  return getMarkingStatuses({
    onlyOverdue: true,
  });
}

/**
 * Создать или получить статус отметки для занятия
 */
export async function ensureMarkingStatus(
  scheduleEventId: string
): Promise<AttendanceMarkingStatusRecord> {
  // Проверяем, существует ли уже
  let status = await getMarkingStatusByEventId(scheduleEventId);
  if (status) {
    return status;
  }

  // Получаем данные занятия
  const [event] = await executeQuery<RowDataPacket[]>(
    `SELECT se.*, 
       (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = se.group_id) as students_count
     FROM schedule_events se 
     WHERE se.id = ?`,
    [scheduleEventId]
  );

  if (!event) {
    throw new Error('Занятие не найдено');
  }

  const settings = await getAttendanceSettings();
  const endTime = new Date(event.end_time);
  const deadline = new Date(endTime.getTime() + settings.ATTENDANCE_MARK_DEADLINE_HOURS * 60 * 60 * 1000);
  const lateDeadline = new Date(endTime.getTime() + settings.ATTENDANCE_EDIT_DEADLINE_HOURS * 60 * 60 * 1000);

  const id = uuidv4();

  await executeQuery(
    `INSERT INTO attendance_marking_status 
     (id, schedule_event_id, status, deadline, late_deadline, students_count)
     VALUES (?, ?, 'pending', ?, ?, ?)`,
    [id, scheduleEventId, deadline, lateDeadline, event.students_count || 0]
  );

  return (await getMarkingStatusByEventId(scheduleEventId))!;
}

/**
 * Обновить статус отметки
 */
export async function updateMarkingStatus(
  scheduleEventId: string,
  data: {
    status?: AttendanceMarkingStatus;
    markedBy?: string;
    markedCount?: number;
    lateReason?: string;
    approvedBy?: string;
  }
): Promise<AttendanceMarkingStatusRecord | null> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.markedBy !== undefined) {
    updates.push('marked_by = ?');
    params.push(data.markedBy);
    updates.push('marked_at = NOW()');
  }

  if (data.markedCount !== undefined) {
    updates.push('marked_count = ?');
    params.push(data.markedCount);
  }

  if (data.lateReason !== undefined) {
    updates.push('late_reason = ?');
    params.push(data.lateReason);
  }

  if (data.approvedBy !== undefined) {
    updates.push('approved_by = ?');
    params.push(data.approvedBy);
    updates.push('approved_at = NOW()');
  }

  if (updates.length === 0) {
    return getMarkingStatusByEventId(scheduleEventId);
  }

  params.push(scheduleEventId);
  await executeQuery(
    `UPDATE attendance_marking_status SET ${updates.join(', ')} WHERE schedule_event_id = ?`,
    params
  );

  return getMarkingStatusByEventId(scheduleEventId);
}

// ============================================================================
// ПРОВЕРКА ДОСТУПА
// ============================================================================

/**
 * Проверить доступ инструктора к отметке посещаемости
 */
export async function checkMarkingAccess(
  scheduleEventId: string,
  userId: string,
  userRole: string,
  instructorId?: string
): Promise<MarkingAccessCheckResult> {
  // Получаем данные занятия
  const [event] = await executeQuery<RowDataPacket[]>(
    `SELECT * FROM schedule_events WHERE id = ?`,
    [scheduleEventId]
  );

  if (!event) {
    return {
      allowed: false,
      status: 'denied',
      deadline: new Date(),
      lateDeadline: new Date(),
      message: 'Занятие не найдено',
    };
  }

  const now = new Date();
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);

  // 1. Проверка: занятие началось?
  if (now < startTime) {
    return {
      allowed: false,
      status: 'denied',
      deadline: new Date(),
      lateDeadline: new Date(),
      message: 'Отметка посещаемости доступна только после начала занятия',
    };
  }

  // 2. Для роли TEACHER — проверка, что это его занятие
  if (userRole === 'TEACHER') {
    if (event.instructor_id !== instructorId) {
      return {
        allowed: false,
        status: 'denied',
        deadline: new Date(),
        lateDeadline: new Date(),
        message: 'Вы не назначены инструктором на это занятие',
      };
    }
  }

  // 3. Получаем настройки и считаем дедлайны
  const settings = await getAttendanceSettings();
  const deadline = new Date(endTime.getTime() + settings.ATTENDANCE_MARK_DEADLINE_HOURS * 60 * 60 * 1000);
  const lateDeadline = new Date(endTime.getTime() + settings.ATTENDANCE_EDIT_DEADLINE_HOURS * 60 * 60 * 1000);

  // 4. Определяем статус доступа
  if (now <= deadline) {
    // В пределах основного дедлайна
    return {
      allowed: true,
      status: 'allowed',
      deadline,
      lateDeadline,
    };
  } else if (now <= lateDeadline && settings.ATTENDANCE_LATE_MARK_ALLOWED) {
    // Опоздание, но разрешено
    return {
      allowed: true,
      status: 'late',
      deadline,
      lateDeadline,
      message: 'Срок отметки истёк. Отметка будет помечена как "Опоздание"',
    };
  } else if (settings.ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE) {
    // Требуется одобрение — но админы могут без одобрения
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return {
        allowed: true,
        status: 'late',
        deadline,
        lateDeadline,
        message: 'Срок истёк, но вы можете отметить как администратор',
      };
    }

    // Проверяем, есть ли одобренный запрос
    const [approvedRequest] = await executeQuery<RowDataPacket[]>(
      `SELECT id FROM attendance_marking_requests 
       WHERE schedule_event_id = ? AND instructor_id = ? AND status = 'approved'`,
      [scheduleEventId, instructorId || '']
    );

    if (approvedRequest) {
      return {
        allowed: true,
        status: 'allowed',
        deadline,
        lateDeadline,
        message: 'Отметка разрешена по одобренному запросу',
        existingRequestId: approvedRequest.id,
      };
    }

    return {
      allowed: false,
      status: 'requires_approval',
      deadline,
      lateDeadline,
      message: 'Срок отметки истёк. Требуется одобрение администратора',
      requiresApproval: true,
    };
  } else {
    // Опоздание разрешено без одобрения
    return {
      allowed: true,
      status: 'late',
      deadline,
      lateDeadline,
      message: 'Срок отметки истёк',
    };
  }
}

// ============================================================================
// ЗАПРОСЫ НА РАЗРЕШЕНИЕ
// ============================================================================

/**
 * Создать запрос на разрешение просроченной отметки
 */
export async function createMarkingRequest(
  data: CreateMarkingRequestInput
): Promise<AttendanceMarkingRequest> {
  const id = uuidv4();

  await executeQuery(
    `INSERT INTO attendance_marking_requests 
     (id, schedule_event_id, instructor_id, reason, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [id, data.scheduleEventId, data.instructorId, data.reason]
  );

  return (await getMarkingRequestById(id))!;
}

/**
 * Получить запрос по ID
 */
export async function getMarkingRequestById(
  id: string
): Promise<AttendanceMarkingRequest | null> {
  const rows = await executeQuery<MarkingRequestRow[]>(
    `SELECT 
      amr.*,
      se.title as event_title,
      se.start_time as event_start_time,
      se.end_time as event_end_time,
      sg.code as group_code,
      i.full_name as instructor_name,
      u.name as reviewer_name
    FROM attendance_marking_requests amr
    JOIN schedule_events se ON amr.schedule_event_id = se.id
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    JOIN instructors i ON amr.instructor_id = i.id
    LEFT JOIN users u ON amr.reviewed_by = u.id
    WHERE amr.id = ?
    LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return mapRowToMarkingRequest(rows[0]);
}

/**
 * Получить все запросы с фильтрами
 */
export async function getMarkingRequests(filters: {
  status?: MarkingRequestStatus;
  instructorId?: string;
}): Promise<AttendanceMarkingRequest[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    conditions.push('amr.status = ?');
    params.push(filters.status);
  }

  if (filters.instructorId) {
    conditions.push('amr.instructor_id = ?');
    params.push(filters.instructorId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await executeQuery<MarkingRequestRow[]>(
    `SELECT 
      amr.*,
      se.title as event_title,
      se.start_time as event_start_time,
      se.end_time as event_end_time,
      sg.code as group_code,
      i.full_name as instructor_name,
      u.name as reviewer_name
    FROM attendance_marking_requests amr
    JOIN schedule_events se ON amr.schedule_event_id = se.id
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    JOIN instructors i ON amr.instructor_id = i.id
    LEFT JOIN users u ON amr.reviewed_by = u.id
    ${whereClause}
    ORDER BY amr.created_at DESC`,
    params
  );

  return rows.map(mapRowToMarkingRequest);
}

/**
 * Получить ожидающие запросы (для администраторов)
 */
export async function getPendingMarkingRequests(): Promise<AttendanceMarkingRequest[]> {
  return getMarkingRequests({ status: 'pending' });
}

/**
 * Рассмотреть запрос на разрешение
 */
export async function reviewMarkingRequest(
  id: string,
  reviewedBy: string,
  data: ReviewMarkingRequestInput
): Promise<AttendanceMarkingRequest | null> {
  const request = await getMarkingRequestById(id);
  if (!request) {
    return null;
  }

  const newStatus: MarkingRequestStatus = data.approved ? 'approved' : 'rejected';

  await executeQuery(
    `UPDATE attendance_marking_requests 
     SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_comment = ?
     WHERE id = ?`,
    [newStatus, reviewedBy, data.comment || null, id]
  );

  // Если одобрено — обновляем статус отметки
  if (data.approved) {
    await updateMarkingStatus(request.scheduleEventId, {
      status: 'approved',
      approvedBy: reviewedBy,
    });
  }

  return getMarkingRequestById(id);
}

// ============================================================================
// СТАТИСТИКА
// ============================================================================

/**
 * Получить статистику по отметкам для дашборда
 */
export async function getMarkingStatistics(instructorId?: string): Promise<{
  pending: number;
  overdue: number;
  late: number;
  onTime: number;
  pendingRequests: number;
}> {
  const params: any[] = [];
  let instructorCondition = '';

  if (instructorId) {
    instructorCondition = 'AND se.instructor_id = ?';
    params.push(instructorId);
  }

  const [stats] = await executeQuery<RowDataPacket[]>(
    `SELECT 
      SUM(CASE WHEN ams.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN ams.status = 'overdue' THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN ams.status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN ams.status = 'on_time' THEN 1 ELSE 0 END) as on_time
    FROM attendance_marking_status ams
    JOIN schedule_events se ON ams.schedule_event_id = se.id
    WHERE se.end_time <= NOW() ${instructorCondition}`,
    params
  );

  // Ожидающие запросы
  const requestParams: any[] = [];
  let requestCondition = '';
  if (instructorId) {
    requestCondition = 'AND instructor_id = ?';
    requestParams.push(instructorId);
  }

  const [requestStats] = await executeQuery<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM attendance_marking_requests WHERE status = 'pending' ${requestCondition}`,
    requestParams
  );

  return {
    pending: Number(stats?.pending || 0),
    overdue: Number(stats?.overdue || 0),
    late: Number(stats?.late || 0),
    onTime: Number(stats?.on_time || 0),
    pendingRequests: Number(requestStats?.count || 0),
  };
}

/**
 * Обновить количество отмеченных студентов
 */
export async function updateMarkedCount(scheduleEventId: string): Promise<void> {
  await executeQuery(
    `UPDATE attendance_marking_status ams
     SET marked_count = (
       SELECT COUNT(*) FROM attendance a WHERE a.schedule_event_id = ?
     )
     WHERE ams.schedule_event_id = ?`,
    [scheduleEventId, scheduleEventId]
  );
}
