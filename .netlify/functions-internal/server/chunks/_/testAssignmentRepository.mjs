import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToTestAssignment(row) {
  return {
    id: row.id,
    schedule_event_id: row.schedule_event_id,
    test_template_id: row.test_template_id,
    group_id: row.group_id,
    time_limit_override: row.time_limit_override,
    passing_score_override: row.passing_score_override,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    assigned_by: row.assigned_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToTestAssignmentWithDetails(row) {
  return {
    ...mapRowToTestAssignment(row),
    template_name: row.template_name || "",
    template_code: row.template_code || "",
    group_name: row.group_name || "",
    event_date: row.event_date || /* @__PURE__ */ new Date(),
    event_start_time: row.event_start_time || "",
    sessions_count: row.sessions_count || 0,
    completed_count: row.completed_count || 0
  };
}
async function getTestAssignmentById(id) {
  const rows = await executeQuery(
    `SELECT 
      ta.*,
      tt.name as template_name,
      tt.code as template_code,
      sg.code as group_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_start_time,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id) as sessions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.status = 'completed') as completed_count
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    WHERE ta.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTestAssignmentWithDetails(rows[0]);
}
async function getTestAssignmentByScheduleEventId(scheduleEventId) {
  const rows = await executeQuery(
    `SELECT 
      ta.*,
      tt.name as template_name,
      tt.code as template_code,
      sg.code as group_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_start_time,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id) as sessions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.status = 'completed') as completed_count
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    WHERE ta.schedule_event_id = ?
    LIMIT 1`,
    [scheduleEventId]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTestAssignmentWithDetails(rows[0]);
}
async function testAssignmentExistsForEventAndTemplate(scheduleEventId, testTemplateId) {
  const rows = await executeQuery(
    "SELECT 1 FROM test_assignments WHERE schedule_event_id = ? AND test_template_id = ? LIMIT 1",
    [scheduleEventId, testTemplateId]
  );
  return rows.length > 0;
}
async function createTestAssignment(data, userId) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  let startDate = null;
  let endDate = null;
  if (data.start_date) {
    startDate = typeof data.start_date === "string" ? new Date(data.start_date) : data.start_date;
  }
  if (data.end_date) {
    endDate = typeof data.end_date === "string" ? new Date(data.end_date) : data.end_date;
  }
  await executeQuery(
    `INSERT INTO test_assignments (
      id, schedule_event_id, test_template_id, group_id,
      time_limit_override, passing_score_override, start_date, end_date,
      status, assigned_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.schedule_event_id,
      data.test_template_id,
      data.group_id,
      data.time_limit_override || null,
      data.passing_score_override || null,
      startDate,
      endDate,
      "scheduled",
      userId || null,
      now,
      now
    ]
  );
  const result = await getTestAssignmentById(id);
  if (!result) {
    throw new Error("Failed to create test assignment");
  }
  return result;
}
async function deleteTestAssignment(id) {
  const result = await executeQuery(
    "DELETE FROM test_assignments WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function getStudentAssignments(studentId, filters = {}) {
  const { status, upcoming } = filters;
  const conditions = [];
  const queryParams = [];
  queryParams.push(studentId);
  queryParams.push(studentId);
  queryParams.push(studentId);
  queryParams.push(studentId);
  conditions.push(`
    ta.group_id IN (
      SELECT sgs.group_id 
      FROM study_group_students sgs 
      WHERE sgs.student_id = ?
    )
  `);
  queryParams.push(studentId);
  if (status) {
    conditions.push("ta.status = ?");
    queryParams.push(status);
  }
  if (upcoming) {
    conditions.push("(ta.end_date IS NULL OR ta.end_date >= NOW())");
    conditions.push("ta.status IN ('scheduled', 'in_progress')");
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT 
      ta.id,
      ta.schedule_event_id,
      ta.test_template_id,
      ta.group_id,
      ta.status,
      ta.start_date,
      ta.end_date,
      tt.name as template_name,
      tt.code as template_code,
      tt.max_attempts,
      COALESCE(ta.time_limit_override, tt.time_limit_minutes) as time_limit,
      COALESCE(ta.passing_score_override, tt.passing_score) as passing_score,
      sg.code as group_name,
      d.name as discipline_name,
      DATE(se.start_time) as event_date,
      TIME(se.start_time) as event_time,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = 1) as questions_count,
      (SELECT COUNT(*) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ?) as attempts_used,
      (SELECT MAX(ts.score_percent) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ? AND ts.status = 'completed') as best_score,
      (SELECT MAX(ts.passed) FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ? AND ts.status = 'completed') as passed,
      (SELECT ts.id FROM test_sessions ts WHERE ts.assignment_id = ta.id AND ts.student_id = ? AND ts.status = 'in_progress' LIMIT 1) as active_session_id
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    LEFT JOIN study_groups sg ON ta.group_id = sg.id
    LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN ta.status = 'in_progress' THEN 0
        WHEN ta.status = 'scheduled' THEN 1
        ELSE 2
      END,
      se.start_time DESC
  `;
  const rows = await executeQuery(query, queryParams);
  return rows.map((row) => ({
    id: row.id,
    schedule_event_id: row.schedule_event_id,
    test_template_id: row.test_template_id,
    group_id: row.group_id,
    template_name: row.template_name || "",
    template_code: row.template_code || "",
    group_name: row.group_name || "",
    discipline_name: row.discipline_name || null,
    event_date: row.event_date || null,
    event_time: row.event_time || null,
    status: row.status,
    // Date объекты сериализуются в ISO UTC строки ("2026-01-06T09:40:00.000Z")
    // Клиент должен использовать new Date() для парсинга
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    time_limit: row.time_limit || null,
    passing_score: row.passing_score || 60,
    max_attempts: row.max_attempts || 1,
    questions_count: row.questions_count || 0,
    attempts_used: row.attempts_used || 0,
    best_score: row.best_score !== null ? parseFloat(row.best_score) : null,
    passed: Boolean(row.passed),
    has_active_session: !!row.active_session_id,
    active_session_id: row.active_session_id || null
  }));
}

export { getTestAssignmentByScheduleEventId as a, getStudentAssignments as b, createTestAssignment as c, deleteTestAssignment as d, getTestAssignmentById as g, testAssignmentExistsForEventAndTemplate as t };
//# sourceMappingURL=testAssignmentRepository.mjs.map
