import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function isoToMySqlDatetime(isoString) {
  const datePart = isoString.substring(0, 10);
  const timePart = isoString.substring(11, 19);
  return `${datePart} ${timePart}`;
}
function dateToLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
function dateToLocalIsoString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDateForDisplay(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 2e3, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function mapRowToScheduleEvent(row) {
  const event = {
    id: row.id,
    title: row.title,
    description: row.description,
    groupId: row.group_id,
    disciplineId: row.discipline_id,
    instructorId: row.instructor_id,
    classroomId: row.classroom_id,
    startTime: row.start_time,
    endTime: row.end_time,
    isAllDay: row.is_all_day,
    color: row.color,
    eventType: row.event_type,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.group_code) {
    event.group = {
      id: row.group_id,
      code: row.group_code,
      courseName: row.course_name || ""
    };
  }
  if (row.instructor_full_name) {
    event.instructor = {
      id: row.instructor_id,
      fullName: row.instructor_full_name
    };
  }
  if (row.classroom_name) {
    event.classroom = {
      id: row.classroom_id,
      name: row.classroom_name,
      capacity: row.classroom_capacity || 0
    };
  }
  if (row.discipline_name) {
    event.discipline = {
      id: row.discipline_id,
      name: row.discipline_name
    };
  }
  return event;
}
function mapRowToClassroom(row) {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getScheduleEvents(filters = {}) {
  const conditions = [];
  const params = [];
  if (filters.startDate && filters.endDate) {
    const startDateStr = filters.startDate.includes("T") ? filters.startDate : `${filters.startDate} 00:00:00`;
    const endDateStr = filters.endDate.includes("T") ? filters.endDate : `${filters.endDate} 23:59:59`;
    conditions.push("((se.start_time >= ? AND se.start_time <= ?) OR (se.end_time >= ? AND se.end_time <= ?) OR (se.start_time <= ? AND se.end_time >= ?))");
    params.push(startDateStr, endDateStr, startDateStr, endDateStr, startDateStr, endDateStr);
  } else if (filters.startDate) {
    const startDateStr = filters.startDate.includes("T") ? filters.startDate : `${filters.startDate} 00:00:00`;
    conditions.push("se.end_time >= ?");
    params.push(startDateStr);
  } else if (filters.endDate) {
    const endDateStr = filters.endDate.includes("T") ? filters.endDate : `${filters.endDate} 23:59:59`;
    conditions.push("se.start_time <= ?");
    params.push(endDateStr);
  }
  if (filters.groupId) {
    conditions.push("se.group_id = ?");
    params.push(filters.groupId);
  }
  if (filters.instructorId) {
    conditions.push("se.instructor_id = ?");
    params.push(filters.instructorId);
  }
  if (filters.classroomId) {
    conditions.push("se.classroom_id = ?");
    params.push(filters.classroomId);
  }
  if (filters.eventType) {
    conditions.push("se.event_type = ?");
    params.push(filters.eventType);
  }
  if (filters.groupIds && filters.groupIds.length > 0) {
    const placeholders = filters.groupIds.map(() => "?").join(", ");
    if (filters.orInstructorId) {
      conditions.push(`(se.group_id IN (${placeholders}) OR se.instructor_id = ?)`);
      params.push(...filters.groupIds, filters.orInstructorId);
    } else {
      conditions.push(`se.group_id IN (${placeholders})`);
      params.push(...filters.groupIds);
    }
  } else if (filters.groupIds && filters.groupIds.length === 0) {
    if (filters.orInstructorId) {
      conditions.push("se.instructor_id = ?");
      params.push(filters.orInstructorId);
    } else {
      return [];
    }
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT 
      se.*,
      sg.code as group_code,
      c.name as course_name,
      i.full_name as instructor_full_name,
      cr.name as classroom_name,
      cr.capacity as classroom_capacity,
      d.name as discipline_name
    FROM schedule_events se
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    ${whereClause}
    ORDER BY se.start_time ASC
  `;
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToScheduleEvent);
}
async function getScheduleEventById(id) {
  const rows = await executeQuery(
    `SELECT 
      se.*,
      sg.code as group_code,
      c.name as course_name,
      i.full_name as instructor_full_name,
      cr.name as classroom_name,
      cr.capacity as classroom_capacity,
      d.name as discipline_name
    FROM schedule_events se
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    WHERE se.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToScheduleEvent(rows[0]);
}
async function createScheduleEvent(data) {
  const id = v4();
  const startTimeMysql = isoToMySqlDatetime(data.startTime);
  const endTimeMysql = isoToMySqlDatetime(data.endTime);
  await executeQuery(
    `INSERT INTO schedule_events (
      id, title, description, group_id, discipline_id, instructor_id, classroom_id,
      start_time, end_time, is_all_day, color, event_type, is_recurring, recurrence_rule, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      data.groupId || null,
      data.disciplineId || null,
      data.instructorId || null,
      data.classroomId || null,
      startTimeMysql,
      endTimeMysql,
      data.isAllDay || false,
      data.color || "primary",
      data.eventType || "theory",
      data.isRecurring || false,
      data.recurrenceRule || null,
      data.notes || null
    ]
  );
  const event = await getScheduleEventById(id);
  if (!event) {
    throw new Error("Failed to create schedule event");
  }
  return event;
}
async function updateScheduleEvent(id, data) {
  const existing = await getScheduleEventById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.title !== void 0) {
    updates.push("title = ?");
    params.push(data.title);
  }
  if (data.description !== void 0) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.groupId !== void 0) {
    updates.push("group_id = ?");
    params.push(data.groupId);
  }
  if (data.disciplineId !== void 0) {
    updates.push("discipline_id = ?");
    params.push(data.disciplineId);
  }
  if (data.instructorId !== void 0) {
    updates.push("instructor_id = ?");
    params.push(data.instructorId);
  }
  if (data.classroomId !== void 0) {
    updates.push("classroom_id = ?");
    params.push(data.classroomId);
  }
  if (data.startTime !== void 0) {
    updates.push("start_time = ?");
    params.push(isoToMySqlDatetime(data.startTime));
  }
  if (data.endTime !== void 0) {
    updates.push("end_time = ?");
    params.push(isoToMySqlDatetime(data.endTime));
  }
  if (data.isAllDay !== void 0) {
    updates.push("is_all_day = ?");
    params.push(data.isAllDay);
  }
  if (data.color !== void 0) {
    updates.push("color = ?");
    params.push(data.color);
  }
  if (data.eventType !== void 0) {
    updates.push("event_type = ?");
    params.push(data.eventType);
  }
  if (data.isRecurring !== void 0) {
    updates.push("is_recurring = ?");
    params.push(data.isRecurring);
  }
  if (data.recurrenceRule !== void 0) {
    updates.push("recurrence_rule = ?");
    params.push(data.recurrenceRule);
  }
  if (data.notes !== void 0) {
    updates.push("notes = ?");
    params.push(data.notes);
  }
  if (updates.length === 0) {
    return existing;
  }
  params.push(id);
  await executeQuery(`UPDATE schedule_events SET ${updates.join(", ")} WHERE id = ?`, params);
  return getScheduleEventById(id);
}
async function deleteScheduleEvent(id) {
  const result = await executeQuery(
    "DELETE FROM schedule_events WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function checkScheduleConflicts(startTime, endTime, options = {}) {
  const startTimeMysql = isoToMySqlDatetime(startTime);
  const endTimeMysql = isoToMySqlDatetime(endTime);
  const conditions = [
    "((se.start_time < ? AND se.end_time > ?) OR (se.start_time >= ? AND se.start_time < ?) OR (se.end_time > ? AND se.end_time <= ?))"
  ];
  const params = [endTimeMysql, startTimeMysql, startTimeMysql, endTimeMysql, startTimeMysql, endTimeMysql];
  const orConditions = [];
  if (options.classroomId) {
    orConditions.push("se.classroom_id = ?");
    params.push(options.classroomId);
  }
  if (options.instructorId) {
    orConditions.push("se.instructor_id = ?");
    params.push(options.instructorId);
  }
  if (options.groupId) {
    orConditions.push("se.group_id = ?");
    params.push(options.groupId);
  }
  if (orConditions.length > 0) {
    conditions.push(`(${orConditions.join(" OR ")})`);
  }
  if (options.excludeEventId) {
    conditions.push("se.id != ?");
    params.push(options.excludeEventId);
  }
  const query = `
    SELECT 
      se.*,
      sg.code as group_code,
      c.name as course_name,
      i.full_name as instructor_full_name,
      cr.name as classroom_name,
      cr.capacity as classroom_capacity,
      d.name as discipline_name
    FROM schedule_events se
    LEFT JOIN study_groups sg ON se.group_id = sg.id
    LEFT JOIN courses c ON sg.course_id = c.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms cr ON se.classroom_id = cr.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY se.start_time ASC
  `;
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToScheduleEvent);
}
async function getClassrooms(activeOnly = true) {
  let query = "SELECT * FROM classrooms";
  const params = [];
  if (activeOnly) {
    query += " WHERE is_active = true";
  }
  query += " ORDER BY name ASC";
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToClassroom);
}
function mapRowToSchedulePeriod(row) {
  return {
    id: row.id,
    periodNumber: row.period_number,
    startTime: row.start_time,
    endTime: row.end_time,
    isAfterBreak: row.is_after_break,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapRowToScheduleSetting(row) {
  return {
    id: row.id,
    settingKey: row.setting_key,
    settingValue: row.setting_value,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getSchedulePeriods(activeOnly = true) {
  let query = "SELECT * FROM schedule_periods";
  const params = [];
  if (activeOnly) {
    query += " WHERE is_active = true";
  }
  query += " ORDER BY period_number ASC";
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToSchedulePeriod);
}
async function updateAllSchedulePeriods(periods) {
  for (const period of periods) {
    await executeQuery(
      `UPDATE schedule_periods 
       SET start_time = ?, end_time = ?, is_after_break = ?
       WHERE period_number = ?`,
      [period.startTime, period.endTime, period.isAfterBreak || false, period.periodNumber]
    );
  }
  return getSchedulePeriods();
}
async function getScheduleSettings() {
  const rows = await executeQuery(
    "SELECT * FROM schedule_settings ORDER BY setting_key ASC"
  );
  return rows.map(mapRowToScheduleSetting);
}
async function updateScheduleSettings(settings) {
  for (const setting of settings) {
    await executeQuery(
      "UPDATE schedule_settings SET setting_value = ? WHERE setting_key = ?",
      [setting.value, setting.key]
    );
  }
  return getScheduleSettings();
}
async function getScheduleSettingsAsObject() {
  const settings = await getScheduleSettings();
  const result = {};
  for (const setting of settings) {
    result[setting.settingKey] = setting.settingValue;
  }
  return result;
}

export { getScheduleEventById as a, formatDateForDisplay as b, checkScheduleConflicts as c, deleteScheduleEvent as d, dateToLocalIsoString as e, formatDateOnly as f, getClassrooms as g, dateToLocalIso as h, getScheduleEvents as i, createScheduleEvent as j, getSchedulePeriods as k, updateAllSchedulePeriods as l, getScheduleSettingsAsObject as m, updateScheduleSettings as n, updateScheduleEvent as u };
//# sourceMappingURL=scheduleRepository.mjs.map
