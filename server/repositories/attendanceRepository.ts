/**
 * Репозиторий для работы с посещаемостью и оценками
 */

import { executeQuery, executeTransaction } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

type FinalGradeStatus = 'in_progress' | 'passed' | 'failed' | 'not_allowed';

interface Attendance {
  id: string;
  studentId: string;
  scheduleEventId: string;
  hoursAttended: number;
  maxHours: number;
  notes: string | null;
  markedBy: string | null;
  markedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  studentName?: string;
  eventTitle?: string;
  eventDate?: Date;
  eventType?: string;
}

interface Grade {
  id: string;
  studentId: string;
  scheduleEventId: string;
  grade: number;
  notes: string | null;
  gradedBy: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Поля для оценок из тестов
  isFromTest: boolean;
  testSessionId: string | null;
  originalGrade: number | null;
  isModified: boolean;
  modifiedBy: string | null;
  modifiedAt: Date | null;
  // Joined fields
  studentName?: string;
  eventTitle?: string;
  eventDate?: Date;
}

interface FinalGrade {
  id: string;
  studentId: string;
  groupId: string;
  disciplineId: string;
  finalGrade: number | null;
  attendancePercent: number | null;
  status: FinalGradeStatus;
  notes: string | null;
  gradedBy: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  studentName?: string;
  disciplineName?: string;
}

interface CreateAttendanceInput {
  studentId: string;
  scheduleEventId: string;
  hoursAttended: number;
  maxHours: number;
  notes?: string;
  markedBy?: string;
}

interface UpdateAttendanceInput {
  hoursAttended?: number;
  notes?: string | null;
  markedBy?: string;
}

interface CreateGradeInput {
  studentId: string;
  scheduleEventId: string;
  grade: number;
  notes?: string;
  gradedBy?: string;
}

interface UpdateGradeInput {
  grade?: number;
  notes?: string | null;
  gradedBy?: string;
}

interface CreateFinalGradeInput {
  studentId: string;
  groupId: string;
  disciplineId: string;
  finalGrade?: number;
  status?: FinalGradeStatus;
  notes?: string;
  gradedBy?: string;
}

interface UpdateFinalGradeInput {
  finalGrade?: number | null;
  attendancePercent?: number | null;
  status?: FinalGradeStatus;
  notes?: string | null;
  gradedBy?: string;
}

interface BulkAttendanceInput {
  scheduleEventId: string;
  maxHours: number;
  markedBy?: string;
  attendances: {
    studentId: string;
    hoursAttended: number;
    notes?: string;
  }[];
}

interface BulkGradeInput {
  scheduleEventId: string;
  gradedBy?: string;
  grades: {
    studentId: string;
    grade: number;
    notes?: string;
  }[];
}

// Фильтры для журнала
interface JournalFilters {
  groupId: string;
  disciplineId: string;
}

// Статистика посещаемости студента
interface AttendanceStats {
  studentId: string;
  totalHoursAttended: number;
  totalMaxHours: number;
  attendancePercent: number;
  eventsAttended: number;
  totalEvents: number;
}

// ============================================================================
// ROW TYPES
// ============================================================================

interface AttendanceRow extends RowDataPacket {
  id: string;
  student_id: string;
  schedule_event_id: string;
  hours_attended: number;
  max_hours: number;
  notes: string | null;
  marked_by: string | null;
  marked_at: Date | null;
  created_at: Date;
  updated_at: Date;
  student_name?: string;
  event_title?: string;
  event_date?: Date;
  event_type?: string;
}

interface GradeRow extends RowDataPacket {
  id: string;
  student_id: string;
  schedule_event_id: string;
  grade: number;
  notes: string | null;
  graded_by: string | null;
  graded_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Поля для оценок из тестов
  is_from_test: boolean;
  test_session_id: string | null;
  original_grade: number | null;
  is_modified: boolean;
  modified_by: string | null;
  modified_at: Date | null;
  // Joined fields
  student_name?: string;
  event_title?: string;
  event_date?: Date;
}

interface FinalGradeRow extends RowDataPacket {
  id: string;
  student_id: string;
  group_id: string;
  discipline_id: string;
  final_grade: number | null;
  attendance_percent: number | null;
  status: FinalGradeStatus;
  notes: string | null;
  graded_by: string | null;
  graded_at: Date | null;
  created_at: Date;
  updated_at: Date;
  student_name?: string;
  discipline_name?: string;
}

interface StatsRow extends RowDataPacket {
  student_id: string;
  total_hours_attended: number;
  total_max_hours: number;
  events_attended: number;
  total_events: number;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

function mapRowToAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    studentId: row.student_id,
    scheduleEventId: row.schedule_event_id,
    hoursAttended: Number(row.hours_attended),
    maxHours: Number(row.max_hours),
    notes: row.notes,
    markedBy: row.marked_by,
    markedAt: row.marked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studentName: row.student_name,
    eventTitle: row.event_title,
    eventDate: row.event_date,
    eventType: row.event_type,
  };
}

function mapRowToGrade(row: GradeRow): Grade {
  return {
    id: row.id,
    studentId: row.student_id,
    scheduleEventId: row.schedule_event_id,
    grade: row.grade,
    notes: row.notes,
    gradedBy: row.graded_by,
    gradedAt: row.graded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Поля для оценок из тестов
    isFromTest: row.is_from_test || false,
    testSessionId: row.test_session_id || null,
    originalGrade: row.original_grade ?? null,
    isModified: row.is_modified || false,
    modifiedBy: row.modified_by || null,
    modifiedAt: row.modified_at || null,
    // Joined fields
    studentName: row.student_name,
    eventTitle: row.event_title,
    eventDate: row.event_date,
  };
}

function mapRowToFinalGrade(row: FinalGradeRow): FinalGrade {
  return {
    id: row.id,
    studentId: row.student_id,
    groupId: row.group_id,
    disciplineId: row.discipline_id,
    finalGrade: row.final_grade,
    attendancePercent: row.attendance_percent ? Number(row.attendance_percent) : null,
    status: row.status,
    notes: row.notes,
    gradedBy: row.graded_by,
    gradedAt: row.graded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    studentName: row.student_name,
    disciplineName: row.discipline_name,
  };
}

// ============================================================================
// ПОСЕЩАЕМОСТЬ
// ============================================================================

/**
 * Получить посещаемость по занятию
 */
export async function getAttendanceByEvent(scheduleEventId: string): Promise<Attendance[]> {
  const sql = `
    SELECT 
      a.*,
      s.full_name as student_name,
      se.title as event_title,
      se.start_time as event_date,
      se.event_type
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN schedule_events se ON a.schedule_event_id = se.id
    WHERE a.schedule_event_id = ?
    ORDER BY s.full_name
  `;

  const rows = await executeQuery<AttendanceRow[]>(sql, [scheduleEventId]);
  return rows.map(mapRowToAttendance);
}

/**
 * Получить посещаемость студента по группе и дисциплине
 */
export async function getStudentAttendance(
  studentId: string,
  groupId: string,
  disciplineId: string
): Promise<Attendance[]> {
  const sql = `
    SELECT 
      a.*,
      s.full_name as student_name,
      se.title as event_title,
      se.start_time as event_date,
      se.event_type
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN schedule_events se ON a.schedule_event_id = se.id
    WHERE a.student_id = ?
      AND se.group_id = ?
      AND se.discipline_id = ?
    ORDER BY se.start_time
  `;

  const rows = await executeQuery<AttendanceRow[]>(sql, [studentId, groupId, disciplineId]);
  return rows.map(mapRowToAttendance);
}

/**
 * Получить или создать запись посещаемости
 */
export async function upsertAttendance(data: CreateAttendanceInput): Promise<Attendance> {
  const id = uuidv4();
  const now = new Date();

  const sql = `
    INSERT INTO attendance (id, student_id, schedule_event_id, hours_attended, max_hours, notes, marked_by, marked_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hours_attended = VALUES(hours_attended),
      notes = VALUES(notes),
      marked_by = VALUES(marked_by),
      marked_at = VALUES(marked_at),
      updated_at = VALUES(updated_at)
  `;

  await executeQuery(sql, [
    id,
    data.studentId,
    data.scheduleEventId,
    data.hoursAttended,
    data.maxHours,
    data.notes || null,
    data.markedBy || null,
    now,
    now,
    now,
  ]);

  // Получаем актуальную запись
  const selectSql = `
    SELECT a.*, s.full_name as student_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    WHERE a.student_id = ? AND a.schedule_event_id = ?
  `;

  const rows = await executeQuery<AttendanceRow[]>(selectSql, [data.studentId, data.scheduleEventId]);
  return mapRowToAttendance(rows[0]);
}

/**
 * Массовая отметка посещаемости
 */
export async function bulkUpsertAttendance(data: BulkAttendanceInput): Promise<number> {
  const now = new Date();

  return executeTransaction(async (connection: PoolConnection) => {
    let count = 0;

    for (const item of data.attendances) {
      const id = uuidv4();

      const sql = `
        INSERT INTO attendance (id, student_id, schedule_event_id, hours_attended, max_hours, notes, marked_by, marked_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          hours_attended = VALUES(hours_attended),
          notes = VALUES(notes),
          marked_by = VALUES(marked_by),
          marked_at = VALUES(marked_at),
          updated_at = VALUES(updated_at)
      `;

      await connection.execute(sql, [
        id,
        item.studentId,
        data.scheduleEventId,
        item.hoursAttended,
        data.maxHours,
        item.notes || null,
        data.markedBy || null,
        now,
        now,
        now,
      ]);

      count++;
    }

    return count;
  });
}

/**
 * Получить статистику посещаемости студента по дисциплине
 */
export async function getAttendanceStats(
  studentId: string,
  groupId: string,
  disciplineId: string
): Promise<AttendanceStats> {
  const sql = `
    SELECT 
      a.student_id,
      COALESCE(SUM(a.hours_attended), 0) as total_hours_attended,
      COALESCE(SUM(a.max_hours), 0) as total_max_hours,
      COUNT(CASE WHEN a.hours_attended > 0 THEN 1 END) as events_attended,
      COUNT(a.id) as total_events
    FROM attendance a
    JOIN schedule_events se ON a.schedule_event_id = se.id
    WHERE a.student_id = ?
      AND se.group_id = ?
      AND se.discipline_id = ?
    GROUP BY a.student_id
  `;

  const rows = await executeQuery<StatsRow[]>(sql, [studentId, groupId, disciplineId]);

  if (rows.length === 0) {
    return {
      studentId,
      totalHoursAttended: 0,
      totalMaxHours: 0,
      attendancePercent: 0,
      eventsAttended: 0,
      totalEvents: 0,
    };
  }

  const row = rows[0];
  const totalHours = Number(row.total_max_hours);
  const attendedHours = Number(row.total_hours_attended);

  return {
    studentId,
    totalHoursAttended: attendedHours,
    totalMaxHours: totalHours,
    attendancePercent: totalHours > 0 ? Math.round((attendedHours / totalHours) * 100 * 100) / 100 : 0,
    eventsAttended: Number(row.events_attended),
    totalEvents: Number(row.total_events),
  };
}

// ============================================================================
// ОЦЕНКИ
// ============================================================================

/**
 * Получить оценки по занятию
 */
export async function getGradesByEvent(scheduleEventId: string): Promise<Grade[]> {
  const sql = `
    SELECT 
      g.*,
      s.full_name as student_name,
      se.title as event_title,
      se.start_time as event_date
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN schedule_events se ON g.schedule_event_id = se.id
    WHERE g.schedule_event_id = ?
    ORDER BY s.full_name
  `;

  const rows = await executeQuery<GradeRow[]>(sql, [scheduleEventId]);
  return rows.map(mapRowToGrade);
}

/**
 * Получить оценки студента по группе и дисциплине
 */
export async function getStudentGrades(
  studentId: string,
  groupId: string,
  disciplineId: string
): Promise<Grade[]> {
  const sql = `
    SELECT 
      g.*,
      s.full_name as student_name,
      se.title as event_title,
      se.start_time as event_date
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN schedule_events se ON g.schedule_event_id = se.id
    WHERE g.student_id = ?
      AND se.group_id = ?
      AND se.discipline_id = ?
      AND se.event_type = 'assessment'
    ORDER BY se.start_time
  `;

  const rows = await executeQuery<GradeRow[]>(sql, [studentId, groupId, disciplineId]);
  return rows.map(mapRowToGrade);
}

/**
 * Получить существующую оценку по студенту и занятию
 */
export async function getExistingGrade(studentId: string, scheduleEventId: string): Promise<Grade | null> {
  const sql = `
    SELECT g.*, s.full_name as student_name
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE g.student_id = ? AND g.schedule_event_id = ?
  `;

  const rows = await executeQuery<GradeRow[]>(sql, [studentId, scheduleEventId]);
  if (rows.length === 0) return null;
  return mapRowToGrade(rows[0]);
}

/**
 * Получить или создать оценку
 * Если оценка была выставлена автоматически из теста и теперь изменяется вручную,
 * сохраняется оригинальная оценка и помечается как изменённая
 */
export async function upsertGrade(data: CreateGradeInput & { forceModify?: boolean }): Promise<Grade> {
  const id = uuidv4();
  const now = new Date();

  // Проверяем, существует ли уже оценка
  const existingGrade = await getExistingGrade(data.studentId, data.scheduleEventId);

  if (existingGrade && existingGrade.isFromTest && !existingGrade.isModified) {
    // Оценка из теста изменяется впервые - сохраняем оригинал
    const updateSql = `
      UPDATE grades SET
        grade = ?,
        original_grade = ?,
        is_modified = TRUE,
        modified_by = ?,
        modified_at = ?,
        notes = ?,
        graded_by = ?,
        graded_at = ?,
        updated_at = ?
      WHERE student_id = ? AND schedule_event_id = ?
    `;

    await executeQuery(updateSql, [
      data.grade,
      existingGrade.grade, // Сохраняем оригинальную оценку
      data.gradedBy || null,
      now,
      data.notes || existingGrade.notes,
      data.gradedBy || null,
      now,
      now,
      data.studentId,
      data.scheduleEventId,
    ]);
  } else if (existingGrade && existingGrade.isFromTest && existingGrade.isModified) {
    // Оценка уже была изменена ранее - обновляем только текущую оценку
    const updateSql = `
      UPDATE grades SET
        grade = ?,
        modified_by = ?,
        modified_at = ?,
        notes = ?,
        graded_by = ?,
        graded_at = ?,
        updated_at = ?
      WHERE student_id = ? AND schedule_event_id = ?
    `;

    await executeQuery(updateSql, [
      data.grade,
      data.gradedBy || null,
      now,
      data.notes || existingGrade.notes,
      data.gradedBy || null,
      now,
      now,
      data.studentId,
      data.scheduleEventId,
    ]);
  } else {
    // Обычная оценка (не из теста) или новая запись
    const sql = `
      INSERT INTO grades (id, student_id, schedule_event_id, grade, notes, graded_by, graded_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        grade = VALUES(grade),
        notes = VALUES(notes),
        graded_by = VALUES(graded_by),
        graded_at = VALUES(graded_at),
        updated_at = VALUES(updated_at)
    `;

    await executeQuery(sql, [
      id,
      data.studentId,
      data.scheduleEventId,
      data.grade,
      data.notes || null,
      data.gradedBy || null,
      now,
      now,
      now,
    ]);
  }

  // Получаем актуальную запись
  const selectSql = `
    SELECT g.*, s.full_name as student_name
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE g.student_id = ? AND g.schedule_event_id = ?
  `;

  const rows = await executeQuery<GradeRow[]>(selectSql, [data.studentId, data.scheduleEventId]);
  return mapRowToGrade(rows[0]);
}

/**
 * Массовое выставление оценок
 */
export async function bulkUpsertGrades(data: BulkGradeInput): Promise<number> {
  const now = new Date();

  return executeTransaction(async (connection: PoolConnection) => {
    let count = 0;

    for (const item of data.grades) {
      const id = uuidv4();

      const sql = `
        INSERT INTO grades (id, student_id, schedule_event_id, grade, notes, graded_by, graded_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          grade = VALUES(grade),
          notes = VALUES(notes),
          graded_by = VALUES(graded_by),
          graded_at = VALUES(graded_at),
          updated_at = VALUES(updated_at)
      `;

      await connection.execute(sql, [
        id,
        item.studentId,
        data.scheduleEventId,
        item.grade,
        item.notes || null,
        data.gradedBy || null,
        now,
        now,
        now,
      ]);

      count++;
    }

    return count;
  });
}

/**
 * Получить среднюю оценку студента по дисциплине
 */
export async function getAverageGrade(
  studentId: string,
  groupId: string,
  disciplineId: string
): Promise<number | null> {
  const sql = `
    SELECT AVG(g.grade) as avg_grade
    FROM grades g
    JOIN schedule_events se ON g.schedule_event_id = se.id
    WHERE g.student_id = ?
      AND se.group_id = ?
      AND se.discipline_id = ?
      AND se.event_type = 'assessment'
  `;

  const rows = await executeQuery<RowDataPacket[]>(sql, [studentId, groupId, disciplineId]);

  if (rows.length === 0 || rows[0].avg_grade === null) {
    return null;
  }

  return Math.round(Number(rows[0].avg_grade) * 100) / 100;
}

// ============================================================================
// ИТОГОВЫЕ ОЦЕНКИ
// ============================================================================

/**
 * Получить итоговые оценки по группе и дисциплине
 */
export async function getFinalGrades(
  groupId: string,
  disciplineId: string
): Promise<FinalGrade[]> {
  const sql = `
    SELECT 
      fg.*,
      s.full_name as student_name,
      d.name as discipline_name
    FROM final_grades fg
    JOIN students s ON fg.student_id = s.id
    JOIN disciplines d ON fg.discipline_id = d.id
    WHERE fg.group_id = ? AND fg.discipline_id = ?
    ORDER BY s.full_name
  `;

  const rows = await executeQuery<FinalGradeRow[]>(sql, [groupId, disciplineId]);
  return rows.map(mapRowToFinalGrade);
}

/**
 * Получить итоговую оценку студента
 */
export async function getStudentFinalGrade(
  studentId: string,
  groupId: string,
  disciplineId: string
): Promise<FinalGrade | null> {
  const sql = `
    SELECT 
      fg.*,
      s.full_name as student_name,
      d.name as discipline_name
    FROM final_grades fg
    JOIN students s ON fg.student_id = s.id
    JOIN disciplines d ON fg.discipline_id = d.id
    WHERE fg.student_id = ? AND fg.group_id = ? AND fg.discipline_id = ?
  `;

  const rows = await executeQuery<FinalGradeRow[]>(sql, [studentId, groupId, disciplineId]);

  if (rows.length === 0) {
    return null;
  }

  return mapRowToFinalGrade(rows[0]);
}

/**
 * Создать или обновить итоговую оценку
 */
export async function upsertFinalGrade(data: CreateFinalGradeInput): Promise<FinalGrade> {
  const id = uuidv4();
  const now = new Date();

  // Получаем статистику посещаемости
  const stats = await getAttendanceStats(data.studentId, data.groupId, data.disciplineId);

  const sql = `
    INSERT INTO final_grades (id, student_id, group_id, discipline_id, final_grade, attendance_percent, status, notes, graded_by, graded_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      final_grade = VALUES(final_grade),
      attendance_percent = VALUES(attendance_percent),
      status = VALUES(status),
      notes = VALUES(notes),
      graded_by = VALUES(graded_by),
      graded_at = VALUES(graded_at),
      updated_at = VALUES(updated_at)
  `;

  await executeQuery(sql, [
    id,
    data.studentId,
    data.groupId,
    data.disciplineId,
    data.finalGrade ?? null,
    stats.attendancePercent,
    data.status || 'in_progress',
    data.notes || null,
    data.gradedBy || null,
    data.finalGrade !== undefined ? now : null,
    now,
    now,
  ]);

  const result = await getStudentFinalGrade(data.studentId, data.groupId, data.disciplineId);
  return result!;
}

/**
 * Обновить итоговую оценку
 */
export async function updateFinalGrade(
  id: string,
  data: UpdateFinalGradeInput
): Promise<FinalGrade | null> {
  const updates: string[] = [];
  const values: any[] = [];
  const now = new Date();

  if (data.finalGrade !== undefined) {
    updates.push('final_grade = ?');
    values.push(data.finalGrade);
    updates.push('graded_at = ?');
    values.push(now);
  }

  if (data.attendancePercent !== undefined) {
    updates.push('attendance_percent = ?');
    values.push(data.attendancePercent);
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }

  if (data.gradedBy !== undefined) {
    updates.push('graded_by = ?');
    values.push(data.gradedBy);
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const sql = `UPDATE final_grades SET ${updates.join(', ')} WHERE id = ?`;
  await executeQuery(sql, values);

  // Получаем обновлённую запись
  const selectSql = `
    SELECT 
      fg.*,
      s.full_name as student_name,
      d.name as discipline_name
    FROM final_grades fg
    JOIN students s ON fg.student_id = s.id
    JOIN disciplines d ON fg.discipline_id = d.id
    WHERE fg.id = ?
  `;

  const rows = await executeQuery<FinalGradeRow[]>(selectSql, [id]);

  if (rows.length === 0) {
    return null;
  }

  return mapRowToFinalGrade(rows[0]);
}

/**
 * Пересчитать процент посещаемости для всех студентов группы по дисциплине
 */
export async function recalculateAttendancePercent(
  groupId: string,
  disciplineId: string
): Promise<void> {
  // Получаем всех студентов группы
  const studentsSql = `
    SELECT student_id FROM study_group_students WHERE group_id = ?
  `;
  const students = await executeQuery<RowDataPacket[]>(studentsSql, [groupId]);

  for (const student of students) {
    const stats = await getAttendanceStats(student.student_id, groupId, disciplineId);

    // Обновляем или создаём запись итоговой оценки
    await upsertFinalGrade({
      studentId: student.student_id,
      groupId,
      disciplineId,
    });
  }
}

// ============================================================================
// ДАННЫЕ ДЛЯ ЖУРНАЛА
// ============================================================================

interface JournalEventRow extends RowDataPacket {
  id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  event_type: string;
}

interface JournalStudentRow extends RowDataPacket {
  student_id: string;
  full_name: string;
  organization: string | null;
}

/**
 * Получить данные для журнала
 */
export async function getJournalData(groupId: string, disciplineId: string): Promise<{
  events: JournalEventRow[];
  students: JournalStudentRow[];
  attendances: Attendance[];
  grades: Grade[];
  finalGrades: FinalGrade[];
}> {
  // Занятия по дисциплине
  const eventsSql = `
    SELECT id, title, start_time, end_time, event_type
    FROM schedule_events
    WHERE group_id = ? AND discipline_id = ?
    ORDER BY start_time
  `;

  console.log('[getJournalData] Query params - groupId:', groupId, 'disciplineId:', disciplineId);

  const events = await executeQuery<JournalEventRow[]>(eventsSql, [groupId, disciplineId]);

  console.log('[getJournalData] Found events:', events.length);

  // Диагностика: проверяем все занятия группы
  if (events.length === 0) {
    const allEventsSql = `
      SELECT id, title, discipline_id, group_id
      FROM schedule_events
      WHERE group_id = ?
    `;
    const allEvents = await executeQuery<any[]>(allEventsSql, [groupId]);
    console.log('[getJournalData] All events for group:', allEvents.length, 'data:', JSON.stringify(allEvents.slice(0, 3)));
  }

  // Студенты группы
  const studentsSql = `
    SELECT s.id as student_id, s.full_name, s.organization
    FROM study_group_students sgs
    JOIN students s ON sgs.student_id = s.id
    WHERE sgs.group_id = ?
    ORDER BY s.full_name
  `;
  const students = await executeQuery<JournalStudentRow[]>(studentsSql, [groupId]);

  // Получаем ID всех занятий
  const eventIds = events.map(e => e.id);

  if (eventIds.length === 0) {
    return { events, students, attendances: [], grades: [], finalGrades: [] };
  }

  // Посещаемость
  const attendanceSql = `
    SELECT a.* FROM attendance a
    WHERE a.schedule_event_id IN (${eventIds.map(() => '?').join(',')})
  `;
  const attendanceRows = await executeQuery<AttendanceRow[]>(attendanceSql, eventIds);
  const attendances = attendanceRows.map(mapRowToAttendance);

  // Оценки
  const gradesSql = `
    SELECT g.* FROM grades g
    WHERE g.schedule_event_id IN (${eventIds.map(() => '?').join(',')})
  `;
  const gradeRows = await executeQuery<GradeRow[]>(gradesSql, eventIds);
  const grades = gradeRows.map(mapRowToGrade);

  // Итоговые оценки
  const finalGrades = await getFinalGrades(groupId, disciplineId);

  return { events, students, attendances, grades, finalGrades };
}

/**
 * Рассчитать количество академических часов между двумя временами
 * 1 академический час = 45 минут
 */
export function calculateAcademicHours(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const academicHours = diffMinutes / 45;

  // Округляем до 0.5
  return Math.round(academicHours * 2) / 2;
}
