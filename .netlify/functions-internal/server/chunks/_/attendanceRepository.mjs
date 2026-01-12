import { p as executeTransaction, e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToAttendance(row) {
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
    eventType: row.event_type
  };
}
function mapRowToGrade(row) {
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
    eventDate: row.event_date
  };
}
function mapRowToFinalGrade(row) {
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
    disciplineName: row.discipline_name
  };
}
async function upsertAttendance(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
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
    now
  ]);
  const selectSql = `
    SELECT a.*, s.full_name as student_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    WHERE a.student_id = ? AND a.schedule_event_id = ?
  `;
  const rows = await executeQuery(selectSql, [data.studentId, data.scheduleEventId]);
  return mapRowToAttendance(rows[0]);
}
async function bulkUpsertAttendance(data) {
  const now = /* @__PURE__ */ new Date();
  return executeTransaction(async (connection) => {
    let count = 0;
    for (const item of data.attendances) {
      const id = v4();
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
        now
      ]);
      count++;
    }
    return count;
  });
}
async function getAttendanceStats(studentId, groupId, disciplineId) {
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
  const rows = await executeQuery(sql, [studentId, groupId, disciplineId]);
  if (rows.length === 0) {
    return {
      studentId,
      totalHoursAttended: 0,
      totalMaxHours: 0,
      attendancePercent: 0,
      eventsAttended: 0,
      totalEvents: 0
    };
  }
  const row = rows[0];
  const totalHours = Number(row.total_max_hours);
  const attendedHours = Number(row.total_hours_attended);
  return {
    studentId,
    totalHoursAttended: attendedHours,
    totalMaxHours: totalHours,
    attendancePercent: totalHours > 0 ? Math.round(attendedHours / totalHours * 100 * 100) / 100 : 0,
    eventsAttended: Number(row.events_attended),
    totalEvents: Number(row.total_events)
  };
}
async function getExistingGrade(studentId, scheduleEventId) {
  const sql = `
    SELECT g.*, s.full_name as student_name
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE g.student_id = ? AND g.schedule_event_id = ?
  `;
  const rows = await executeQuery(sql, [studentId, scheduleEventId]);
  if (rows.length === 0) return null;
  return mapRowToGrade(rows[0]);
}
async function upsertGrade(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  const existingGrade = await getExistingGrade(data.studentId, data.scheduleEventId);
  if (existingGrade && existingGrade.isFromTest && !existingGrade.isModified) {
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
      existingGrade.grade,
      // Сохраняем оригинальную оценку
      data.gradedBy || null,
      now,
      data.notes || existingGrade.notes,
      data.gradedBy || null,
      now,
      now,
      data.studentId,
      data.scheduleEventId
    ]);
  } else if (existingGrade && existingGrade.isFromTest && existingGrade.isModified) {
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
      data.scheduleEventId
    ]);
  } else {
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
      now
    ]);
  }
  const selectSql = `
    SELECT g.*, s.full_name as student_name
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE g.student_id = ? AND g.schedule_event_id = ?
  `;
  const rows = await executeQuery(selectSql, [data.studentId, data.scheduleEventId]);
  return mapRowToGrade(rows[0]);
}
async function bulkUpsertGrades(data) {
  const now = /* @__PURE__ */ new Date();
  return executeTransaction(async (connection) => {
    let count = 0;
    for (const item of data.grades) {
      const id = v4();
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
        now
      ]);
      count++;
    }
    return count;
  });
}
async function getFinalGrades(groupId, disciplineId) {
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
  const rows = await executeQuery(sql, [groupId, disciplineId]);
  return rows.map(mapRowToFinalGrade);
}
async function getStudentFinalGrade(studentId, groupId, disciplineId) {
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
  const rows = await executeQuery(sql, [studentId, groupId, disciplineId]);
  if (rows.length === 0) {
    return null;
  }
  return mapRowToFinalGrade(rows[0]);
}
async function upsertFinalGrade(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
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
    data.status || "in_progress",
    data.notes || null,
    data.gradedBy || null,
    data.finalGrade !== void 0 ? now : null,
    now,
    now
  ]);
  const result = await getStudentFinalGrade(data.studentId, data.groupId, data.disciplineId);
  return result;
}
async function getJournalData(groupId, disciplineId) {
  const eventsSql = `
    SELECT id, title, start_time, end_time, event_type
    FROM schedule_events
    WHERE group_id = ? AND discipline_id = ?
    ORDER BY start_time
  `;
  console.log("[getJournalData] Query params - groupId:", groupId, "disciplineId:", disciplineId);
  const events = await executeQuery(eventsSql, [groupId, disciplineId]);
  console.log("[getJournalData] Found events:", events.length);
  if (events.length === 0) {
    const allEventsSql = `
      SELECT id, title, discipline_id, group_id
      FROM schedule_events
      WHERE group_id = ?
    `;
    const allEvents = await executeQuery(allEventsSql, [groupId]);
    console.log("[getJournalData] All events for group:", allEvents.length, "data:", JSON.stringify(allEvents.slice(0, 3)));
  }
  const studentsSql = `
    SELECT s.id as student_id, s.full_name, s.organization
    FROM study_group_students sgs
    JOIN students s ON sgs.student_id = s.id
    WHERE sgs.group_id = ?
    ORDER BY s.full_name
  `;
  const students = await executeQuery(studentsSql, [groupId]);
  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) {
    return { events, students, attendances: [], grades: [], finalGrades: [] };
  }
  const attendanceSql = `
    SELECT a.* FROM attendance a
    WHERE a.schedule_event_id IN (${eventIds.map(() => "?").join(",")})
  `;
  const attendanceRows = await executeQuery(attendanceSql, eventIds);
  const attendances = attendanceRows.map(mapRowToAttendance);
  const gradesSql = `
    SELECT g.* FROM grades g
    WHERE g.schedule_event_id IN (${eventIds.map(() => "?").join(",")})
  `;
  const gradeRows = await executeQuery(gradesSql, eventIds);
  const grades = gradeRows.map(mapRowToGrade);
  const finalGrades = await getFinalGrades(groupId, disciplineId);
  return { events, students, attendances, grades, finalGrades };
}
function calculateAcademicHours(startTime, endTime) {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = diffMs / (1e3 * 60);
  const academicHours = diffMinutes / 45;
  return Math.round(academicHours * 2) / 2;
}

export { upsertFinalGrade as a, bulkUpsertAttendance as b, calculateAcademicHours as c, bulkUpsertGrades as d, getExistingGrade as e, upsertGrade as f, getJournalData as g, upsertAttendance as u };
//# sourceMappingURL=attendanceRepository.mjs.map
