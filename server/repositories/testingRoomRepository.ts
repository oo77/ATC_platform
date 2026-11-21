/**
 * Репозиторий класса тестирования: компьютеры (по IP) и посадка слушателей
 */

import { executeQuery } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { ResultSetHeader } from "mysql2/promise";

// ============================================================================
// ТИПЫ
// ============================================================================

export interface Workstation {
  id: string;
  number: number;
  name: string;
  ipAddress: string;
  isActive: boolean;
}

export type SeatStatus = "pending" | "claimed" | "released" | "cancelled";

export interface Seat {
  id: string;
  workstationId: string;
  assignmentId: string;
  studentId: string;
  language: string;
  status: SeatStatus;
  sessionId: string | null;
  createdAt: Date;
  claimedAt: Date | null;
}

/** Активная посадка с данными для экрана администратора */
export interface SeatDetails extends Seat {
  studentName: string;
  templateName: string;
  groupCode: string;
  sessionStatus: string | null;
  scorePercent: number | null;
  passed: boolean | null;
  sessionStartedAt: Date | null;
}

function mapWorkstation(row: any): Workstation {
  return {
    id: row.id,
    number: Number(row.number),
    name: row.name,
    ipAddress: row.ip_address,
    isActive: !!row.is_active,
  };
}

function mapSeat(row: any): Seat {
  return {
    id: row.id,
    workstationId: row.workstation_id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    language: row.language,
    status: row.status,
    sessionId: row.session_id || null,
    createdAt: row.created_at,
    claimedAt: row.claimed_at || null,
  };
}

// ============================================================================
// КОМПЬЮТЕРЫ
// ============================================================================

export async function listWorkstations(): Promise<Workstation[]> {
  const rows = await executeQuery<any[]>(
    "SELECT * FROM testing_workstations ORDER BY number ASC, name ASC",
  );
  return rows.map(mapWorkstation);
}

export async function getWorkstationById(id: string): Promise<Workstation | null> {
  const rows = await executeQuery<any[]>(
    "SELECT * FROM testing_workstations WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ? mapWorkstation(rows[0]) : null;
}

export async function getWorkstationByIp(ip: string): Promise<Workstation | null> {
  const rows = await executeQuery<any[]>(
    "SELECT * FROM testing_workstations WHERE ip_address = ? LIMIT 1",
    [ip],
  );
  return rows[0] ? mapWorkstation(rows[0]) : null;
}

export async function getNextWorkstationNumber(): Promise<number> {
  const rows = await executeQuery<any[]>(
    "SELECT COALESCE(MAX(number), 0) AS max_number FROM testing_workstations",
  );
  return Number(rows[0]?.max_number || 0) + 1;
}

export async function createWorkstation(data: {
  number: number;
  name: string;
  ipAddress: string;
}): Promise<Workstation> {
  const id = uuidv4();
  await executeQuery(
    "INSERT INTO testing_workstations (id, number, name, ip_address) VALUES (?, ?, ?, ?)",
    [id, data.number, data.name, data.ipAddress],
  );
  return (await getWorkstationById(id))!;
}

export async function updateWorkstation(
  id: string,
  data: Partial<{ number: number; name: string; ipAddress: string; isActive: boolean }>,
): Promise<Workstation | null> {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.number !== undefined) {
    sets.push("number = ?");
    params.push(data.number);
  }
  if (data.name !== undefined) {
    sets.push("name = ?");
    params.push(data.name);
  }
  if (data.ipAddress !== undefined) {
    sets.push("ip_address = ?");
    params.push(data.ipAddress);
  }
  if (data.isActive !== undefined) {
    sets.push("is_active = ?");
    params.push(data.isActive ? 1 : 0);
  }
  if (sets.length) {
    await executeQuery(`UPDATE testing_workstations SET ${sets.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
  }
  return getWorkstationById(id);
}

export async function deleteWorkstation(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM testing_workstations WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

// ============================================================================
// ПОСАДКА
// ============================================================================

export async function getSeatById(id: string): Promise<Seat | null> {
  const rows = await executeQuery<any[]>("SELECT * FROM testing_seats WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapSeat(rows[0]) : null;
}

/** Активная (pending / claimed) посадка за компьютером */
export async function getActiveSeatForWorkstation(workstationId: string): Promise<Seat | null> {
  const rows = await executeQuery<any[]>(
    `SELECT * FROM testing_seats
      WHERE workstation_id = ? AND status IN ('pending','claimed')
      ORDER BY created_at DESC LIMIT 1`,
    [workstationId],
  );
  return rows[0] ? mapSeat(rows[0]) : null;
}

/** Активные посадки слушателя (на любом компьютере) */
export async function getActiveSeatsForStudent(studentId: string): Promise<Seat[]> {
  const rows = await executeQuery<any[]>(
    `SELECT * FROM testing_seats WHERE student_id = ? AND status IN ('pending','claimed')`,
    [studentId],
  );
  return rows.map(mapSeat);
}

export async function createSeat(data: {
  workstationId: string;
  assignmentId: string;
  studentId: string;
  language: string;
  assignedBy: string | null;
}): Promise<Seat> {
  const id = uuidv4();
  await executeQuery(
    `INSERT INTO testing_seats (id, workstation_id, assignment_id, student_id, language, status, assigned_by)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [id, data.workstationId, data.assignmentId, data.studentId, data.language, data.assignedBy],
  );
  return (await getSeatById(id))!;
}

/** Завершить посадку (released — компьютер освобождён, cancelled — отменена до входа) */
export async function closeSeat(id: string, status: "released" | "cancelled"): Promise<void> {
  await executeQuery(
    `UPDATE testing_seats
        SET status = ?, ticket_hash = NULL, ticket_expires_at = NULL, released_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND status IN ('pending','claimed')`,
    [status, id],
  );
}

/** Новый одноразовый билет для ожидающей посадки (старый перестаёт действовать) */
export async function setSeatTicket(id: string, ticketHash: string, expiresAt: Date): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    `UPDATE testing_seats SET ticket_hash = ?, ticket_expires_at = ?
      WHERE id = ? AND status = 'pending'`,
    [ticketHash, expiresAt, id],
  );
  return result.affectedRows > 0;
}

export async function findPendingSeatByTicket(ticketHash: string): Promise<Seat | null> {
  const rows = await executeQuery<any[]>(
    `SELECT * FROM testing_seats
      WHERE ticket_hash = ? AND status = 'pending' AND ticket_expires_at > CURRENT_TIMESTAMP(3)
      LIMIT 1`,
    [ticketHash],
  );
  return rows[0] ? mapSeat(rows[0]) : null;
}

/**
 * Атомарно погасить билет: только один запрос может перевести посадку
 * из pending в claimed (защита от двойного входа с двух вкладок)
 */
export async function consumeSeatTicket(id: string, ticketHash: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    `UPDATE testing_seats
        SET status = 'claimed', ticket_hash = NULL, ticket_expires_at = NULL, claimed_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND ticket_hash = ? AND status = 'pending'`,
    [id, ticketHash],
  );
  return result.affectedRows > 0;
}

export async function setSeatSession(id: string, sessionId: string): Promise<void> {
  await executeQuery("UPDATE testing_seats SET session_id = ? WHERE id = ?", [sessionId, id]);
}

const SEAT_DETAILS_SELECT = `
  SELECT ts.*,
         s.full_name AS student_name,
         tt.name AS template_name,
         sg.code AS group_code,
         sess.status AS session_status,
         sess.score_percent AS score_percent,
         sess.passed AS passed,
         sess.started_at AS session_started_at
    FROM testing_seats ts
    JOIN students s ON s.id = ts.student_id
    JOIN test_assignments ta ON ta.id = ts.assignment_id
    LEFT JOIN test_templates tt ON tt.id = ta.test_template_id
    LEFT JOIN study_groups sg ON sg.id = ta.group_id
    LEFT JOIN test_sessions sess ON sess.id = ts.session_id
`;

function mapSeatDetails(row: any): SeatDetails {
  return {
    ...mapSeat(row),
    studentName: row.student_name,
    templateName: row.template_name || "",
    groupCode: row.group_code || "",
    sessionStatus: row.session_status || null,
    scorePercent: row.score_percent === null || row.score_percent === undefined ? null : Number(row.score_percent),
    passed: row.passed === null || row.passed === undefined ? null : !!row.passed,
    sessionStartedAt: row.session_started_at || null,
  };
}

export async function getActiveSeatsWithDetails(): Promise<SeatDetails[]> {
  const rows = await executeQuery<any[]>(
    `${SEAT_DETAILS_SELECT} WHERE ts.status IN ('pending','claimed') ORDER BY ts.created_at DESC`,
  );
  return rows.map(mapSeatDetails);
}

export async function getSeatDetailsById(id: string): Promise<SeatDetails | null> {
  const rows = await executeQuery<any[]>(`${SEAT_DETAILS_SELECT} WHERE ts.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapSeatDetails(rows[0]) : null;
}

// ============================================================================
// ТЕСТЫ НА ДАТУ И СЛУШАТЕЛИ
// ============================================================================

export interface RoomAssignment {
  id: string;
  groupId: string;
  groupCode: string;
  templateId: string;
  templateName: string;
  eventTitle: string | null;
  eventStart: Date | null;
  eventEnd: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  studentsCount: number;
  completedCount: number;
}

/**
 * Назначенные тесты на дату: занятие в расписании в этот день,
 * либо окно сдачи (start_date..end_date) захватывает этот день
 */
export async function getAssignmentsForDate(date: string): Promise<RoomAssignment[]> {
  const rows = await executeQuery<any[]>(
    `SELECT ta.id, ta.group_id, ta.test_template_id, ta.status, ta.start_date, ta.end_date,
            ta.allowed_student_ids,
            sg.code AS group_code,
            tt.name AS template_name,
            se.title AS event_title, se.start_time AS event_start, se.end_time AS event_end,
            (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = ta.group_id) AS group_size,
            (SELECT COUNT(DISTINCT s2.student_id) FROM test_sessions s2
              WHERE s2.assignment_id = ta.id AND s2.status = 'completed'
                AND COALESCE(s2.is_preview, 0) = 0) AS completed_count
       FROM test_assignments ta
       LEFT JOIN study_groups sg ON sg.id = ta.group_id
       LEFT JOIN test_templates tt ON tt.id = ta.test_template_id
       LEFT JOIN schedule_events se ON se.id = ta.schedule_event_id
      WHERE ta.status <> 'cancelled'
        AND (
          DATE(se.start_time) = ?
          OR (ta.start_date IS NOT NULL AND ta.end_date IS NOT NULL
              AND DATE(ta.start_date) <= ? AND DATE(ta.end_date) >= ?)
        )
      ORDER BY se.start_time ASC, tt.name ASC`,
    [date, date, date],
  );

  return rows.map((row) => {
    const allowed = parseJsonArray(row.allowed_student_ids);
    return {
      id: row.id,
      groupId: row.group_id,
      groupCode: row.group_code || "",
      templateId: row.test_template_id,
      templateName: row.template_name || "",
      eventTitle: row.event_title || null,
      eventStart: row.event_start || null,
      eventEnd: row.event_end || null,
      startDate: row.start_date || null,
      endDate: row.end_date || null,
      status: row.status,
      studentsCount: allowed ? allowed.length : Number(row.group_size || 0),
      completedCount: Number(row.completed_count || 0),
    };
  });
}

export function parseJsonArray(value: any): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.length ? value : null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export interface RoomStudent {
  id: string;
  fullName: string;
  pinfl: string;
  hasAccount: boolean;
  attemptsUsed: number;
  lastStatus: string | null;
  lastScore: number | null;
  lastPassed: boolean | null;
  activeSessionId: string | null;
}

/** Слушатели, которые сдают назначенный тест (группа или список допущенных) */
export async function getAssignmentStudents(
  assignmentId: string,
  groupId: string,
  allowedStudentIds: string[] | null,
): Promise<RoomStudent[]> {
  const params: any[] = [assignmentId, assignmentId, assignmentId, groupId];
  let allowedClause = "";
  if (allowedStudentIds && allowedStudentIds.length) {
    allowedClause = `AND s.id IN (${allowedStudentIds.map(() => "?").join(",")})`;
    params.push(...allowedStudentIds);
  }

  const rows = await executeQuery<any[]>(
    `SELECT s.id, s.full_name, s.pinfl, s.user_id,
            (SELECT COUNT(*) FROM test_sessions t
              WHERE t.assignment_id = ? AND t.student_id = s.id AND COALESCE(t.is_preview, 0) = 0) AS attempts_used,
            (SELECT CONCAT_WS('|', t.status, COALESCE(t.score_percent, ''), COALESCE(t.passed, ''), t.id)
               FROM test_sessions t
              WHERE t.assignment_id = ? AND t.student_id = s.id AND COALESCE(t.is_preview, 0) = 0
              ORDER BY t.attempt_number DESC LIMIT 1) AS last_session,
            (SELECT t.id FROM test_sessions t
              WHERE t.assignment_id = ? AND t.student_id = s.id AND t.status = 'in_progress' LIMIT 1) AS active_session_id
       FROM study_group_students sgs
       JOIN students s ON s.id = sgs.student_id
      WHERE sgs.group_id = ? ${allowedClause}
      ORDER BY s.full_name ASC`,
    params,
  );

  return rows.map((row) => {
    const [status, score, passed] = String(row.last_session || "").split("|");
    return {
      id: row.id,
      fullName: row.full_name,
      pinfl: row.pinfl,
      hasAccount: !!row.user_id,
      attemptsUsed: Number(row.attempts_used || 0),
      lastStatus: status || null,
      lastScore: score ? Number(score) : null,
      lastPassed: passed === "" || passed === undefined ? null : passed === "1",
      activeSessionId: row.active_session_id || null,
    };
  });
}
