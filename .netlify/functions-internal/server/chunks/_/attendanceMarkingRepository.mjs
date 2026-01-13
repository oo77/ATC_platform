import { e as executeQuery } from './nitro.mjs';
import { v4 } from 'uuid';

function mapRowToMarkingStatus(row) {
  const record = {
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
    updatedAt: row.updated_at
  };
  if (row.event_title) {
    record.event = {
      id: row.schedule_event_id,
      title: row.event_title,
      startTime: row.event_start_time,
      endTime: row.event_end_time,
      eventType: row.event_type || "other",
      disciplineId: row.discipline_id || null,
      groupId: row.group_id || null,
      groupCode: row.group_code || null,
      instructorId: row.instructor_id || null,
      instructorName: row.instructor_name || null
    };
  }
  if (row.marked_by && row.marked_by_name) {
    record.markedByUser = {
      id: row.marked_by,
      fullName: row.marked_by_name
    };
  }
  return record;
}
function mapRowToMarkingRequest(row) {
  const request = {
    id: row.id,
    scheduleEventId: row.schedule_event_id,
    instructorId: row.instructor_id,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewComment: row.review_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.event_title) {
    request.event = {
      id: row.schedule_event_id,
      title: row.event_title,
      startTime: row.event_start_time,
      endTime: row.event_end_time,
      groupCode: row.group_code || null
    };
  }
  if (row.instructor_name) {
    request.instructor = {
      id: row.instructor_id,
      fullName: row.instructor_name
    };
  }
  if (row.reviewed_by && row.reviewer_name) {
    request.reviewer = {
      id: row.reviewed_by,
      fullName: row.reviewer_name
    };
  }
  return request;
}
async function getAttendanceSettings() {
  const rows = await executeQuery(
    "SELECT * FROM attendance_settings"
  );
  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }
  return {
    ATTENDANCE_MARK_DEADLINE_HOURS: parseInt(
      settings.ATTENDANCE_MARK_DEADLINE_HOURS || "24",
      10
    ),
    ATTENDANCE_EDIT_DEADLINE_HOURS: parseInt(
      settings.ATTENDANCE_EDIT_DEADLINE_HOURS || "72",
      10
    ),
    ATTENDANCE_LATE_MARK_ALLOWED: settings.ATTENDANCE_LATE_MARK_ALLOWED !== "false",
    ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE: settings.ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE !== "false",
    ATTENDANCE_REMINDER_HOURS_BEFORE: parseInt(
      settings.ATTENDANCE_REMINDER_HOURS_BEFORE || "2",
      10
    ),
    ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD: parseInt(
      settings.ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD || "48",
      10
    ),
    ATTENDANCE_AUTO_CREATE_STATUS: settings.ATTENDANCE_AUTO_CREATE_STATUS !== "false"
  };
}
async function updateAttendanceSetting(key, value, updatedBy) {
  await executeQuery(
    `UPDATE attendance_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?`,
    [value, updatedBy || null, key]
  );
}
async function getMarkingStatusByEventId(scheduleEventId) {
  const rows = await executeQuery(
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
async function getMarkingStatuses(filters = {}) {
  const conditions = [];
  const params = [];
  if (filters.instructorId) {
    conditions.push("se.instructor_id = ?");
    params.push(filters.instructorId);
  }
  if (filters.groupId) {
    conditions.push("se.group_id = ?");
    params.push(filters.groupId);
  }
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      const placeholders = filters.status.map(() => "?").join(", ");
      conditions.push(`ams.status IN (${placeholders})`);
      params.push(...filters.status);
    } else {
      conditions.push("ams.status = ?");
      params.push(filters.status);
    }
  }
  if (filters.dateFrom) {
    conditions.push("se.start_time >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push("se.start_time <= ?");
    params.push(filters.dateTo);
  }
  if (filters.onlyOverdue) {
    conditions.push("ams.status = ?");
    params.push("overdue");
  }
  if (filters.onlyPending) {
    conditions.push("ams.status IN (?, ?)");
    params.push("pending", "in_progress");
  }
  conditions.push("se.end_time <= NOW()");
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await executeQuery(
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
async function getPendingMarkingsForInstructor(instructorId) {
  return getMarkingStatuses({
    instructorId,
    onlyPending: true
  });
}
async function getOverdueMarkings() {
  await executeQuery(
    `UPDATE attendance_marking_status 
     SET status = 'overdue' 
     WHERE status IN ('pending', 'in_progress') 
       AND late_deadline < NOW()`
  );
  return getMarkingStatuses({
    onlyOverdue: true
  });
}
async function ensureMarkingStatus(scheduleEventId) {
  let status = await getMarkingStatusByEventId(scheduleEventId);
  if (status) {
    return status;
  }
  const [event] = await executeQuery(
    `SELECT se.*, 
       (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = se.group_id) as students_count
     FROM schedule_events se 
     WHERE se.id = ?`,
    [scheduleEventId]
  );
  if (!event) {
    throw new Error("\u0417\u0430\u043D\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
  }
  const settings = await getAttendanceSettings();
  const endTime = new Date(event.end_time);
  const deadline = new Date(
    endTime.getTime() + settings.ATTENDANCE_MARK_DEADLINE_HOURS * 60 * 60 * 1e3
  );
  const lateDeadline = new Date(
    endTime.getTime() + settings.ATTENDANCE_EDIT_DEADLINE_HOURS * 60 * 60 * 1e3
  );
  const id = v4();
  await executeQuery(
    `INSERT INTO attendance_marking_status 
     (id, schedule_event_id, status, deadline, late_deadline, students_count)
     VALUES (?, ?, 'pending', ?, ?, ?)`,
    [id, scheduleEventId, deadline, lateDeadline, event.students_count || 0]
  );
  return await getMarkingStatusByEventId(scheduleEventId);
}
async function updateMarkingStatus(scheduleEventId, data) {
  const updates = [];
  const params = [];
  if (data.status !== void 0) {
    updates.push("status = ?");
    params.push(data.status);
  }
  if (data.markedBy !== void 0) {
    updates.push("marked_by = ?");
    params.push(data.markedBy);
    updates.push("marked_at = NOW()");
  }
  if (data.markedCount !== void 0) {
    updates.push("marked_count = ?");
    params.push(data.markedCount);
  }
  if (data.lateReason !== void 0) {
    updates.push("late_reason = ?");
    params.push(data.lateReason);
  }
  if (data.approvedBy !== void 0) {
    updates.push("approved_by = ?");
    params.push(data.approvedBy);
    updates.push("approved_at = NOW()");
  }
  if (updates.length === 0) {
    return getMarkingStatusByEventId(scheduleEventId);
  }
  params.push(scheduleEventId);
  await executeQuery(
    `UPDATE attendance_marking_status SET ${updates.join(
      ", "
    )} WHERE schedule_event_id = ?`,
    params
  );
  return getMarkingStatusByEventId(scheduleEventId);
}
async function syncMarkingStatuses() {
  const missingEvents = await executeQuery(
    `SELECT se.id, se.end_time, se.group_id 
     FROM schedule_events se
     LEFT JOIN attendance_marking_status ams ON se.id = ams.schedule_event_id
     WHERE se.end_time <= NOW() 
       AND se.end_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       AND ams.id IS NULL
     LIMIT 100`
  );
  if (missingEvents.length === 0) return;
  const settings = await getAttendanceSettings();
  for (const event of missingEvents) {
    try {
      const endTime = new Date(event.end_time);
      const deadline = new Date(
        endTime.getTime() + settings.ATTENDANCE_MARK_DEADLINE_HOURS * 60 * 60 * 1e3
      );
      const lateDeadline = new Date(
        endTime.getTime() + settings.ATTENDANCE_EDIT_DEADLINE_HOURS * 60 * 60 * 1e3
      );
      const [countResult] = await executeQuery(
        "SELECT COUNT(*) as count FROM study_group_students WHERE group_id = ?",
        [event.group_id]
      );
      const studentsCount = countResult?.[0]?.count || 0;
      const id = v4();
      let initialStatus = "pending";
      const now = /* @__PURE__ */ new Date();
      if (now > lateDeadline) {
        initialStatus = "overdue";
      }
      await executeQuery(
        `INSERT INTO attendance_marking_status 
         (id, schedule_event_id, status, deadline, late_deadline, students_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, event.id, initialStatus, deadline, lateDeadline, studentsCount]
      );
    } catch (e) {
      console.error(`Error syncing status for event ${event.id}:`, e);
    }
  }
}
async function checkMarkingAccess(scheduleEventId, userId, userRole, instructorId) {
  const [event] = await executeQuery(
    `SELECT * FROM schedule_events WHERE id = ?`,
    [scheduleEventId]
  );
  if (!event) {
    return {
      allowed: false,
      status: "denied",
      deadline: /* @__PURE__ */ new Date(),
      lateDeadline: /* @__PURE__ */ new Date(),
      message: "\u0417\u0430\u043D\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
    };
  }
  const now = /* @__PURE__ */ new Date();
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  if (now < startTime) {
    return {
      allowed: false,
      status: "denied",
      deadline: /* @__PURE__ */ new Date(),
      lateDeadline: /* @__PURE__ */ new Date(),
      message: "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u043D\u0430\u0447\u0430\u043B\u0430 \u0437\u0430\u043D\u044F\u0442\u0438\u044F"
    };
  }
  const [existingStatus] = await executeQuery(
    `SELECT status, deadline, late_deadline FROM attendance_marking_status WHERE schedule_event_id = ?`,
    [scheduleEventId]
  );
  if (existingStatus && existingStatus.status === "approved") {
    return {
      allowed: true,
      status: "allowed",
      deadline: existingStatus.deadline,
      lateDeadline: existingStatus.lateDeadline,
      message: "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C",
      isApprovedByAdmin: true
    };
  }
  if (userRole === "TEACHER") {
    if (event.instructor_id !== instructorId) {
      return {
        allowed: false,
        status: "denied",
        deadline: /* @__PURE__ */ new Date(),
        lateDeadline: /* @__PURE__ */ new Date(),
        message: "\u0412\u044B \u043D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u044B \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u043C \u043D\u0430 \u044D\u0442\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u0435"
      };
    }
  }
  const settings = await getAttendanceSettings();
  const deadline = new Date(
    endTime.getTime() + settings.ATTENDANCE_MARK_DEADLINE_HOURS * 60 * 60 * 1e3
  );
  const lateDeadline = new Date(
    endTime.getTime() + settings.ATTENDANCE_EDIT_DEADLINE_HOURS * 60 * 60 * 1e3
  );
  if (now <= deadline) {
    return {
      allowed: true,
      status: "allowed",
      deadline,
      lateDeadline
    };
  } else if (now <= lateDeadline && settings.ATTENDANCE_LATE_MARK_ALLOWED) {
    return {
      allowed: true,
      status: "late",
      deadline,
      lateDeadline,
      message: '\u0421\u0440\u043E\u043A \u043E\u0442\u043C\u0435\u0442\u043A\u0438 \u0438\u0441\u0442\u0451\u043A. \u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0431\u0443\u0434\u0435\u0442 \u043F\u043E\u043C\u0435\u0447\u0435\u043D\u0430 \u043A\u0430\u043A "\u041E\u043F\u043E\u0437\u0434\u0430\u043D\u0438\u0435"'
    };
  } else if (settings.ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE) {
    if (userRole === "ADMIN" || userRole === "MANAGER") {
      return {
        allowed: true,
        status: "late",
        deadline,
        lateDeadline,
        message: "\u0421\u0440\u043E\u043A \u0438\u0441\u0442\u0451\u043A, \u043D\u043E \u0432\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440"
      };
    }
    const [approvedRequest] = await executeQuery(
      `SELECT id FROM attendance_marking_requests 
       WHERE schedule_event_id = ? AND instructor_id = ? AND status = 'approved'`,
      [scheduleEventId, instructorId || ""]
    );
    if (approvedRequest) {
      return {
        allowed: true,
        status: "allowed",
        deadline,
        lateDeadline,
        message: "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0430 \u043F\u043E \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u043E\u043C\u0443 \u0437\u0430\u043F\u0440\u043E\u0441\u0443",
        existingRequestId: approvedRequest.id
      };
    }
    return {
      allowed: false,
      status: "requires_approval",
      deadline,
      lateDeadline,
      message: "\u0421\u0440\u043E\u043A \u043E\u0442\u043C\u0435\u0442\u043A\u0438 \u0438\u0441\u0442\u0451\u043A. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430",
      requiresApproval: true
    };
  } else {
    return {
      allowed: true,
      status: "late",
      deadline,
      lateDeadline,
      message: "\u0421\u0440\u043E\u043A \u043E\u0442\u043C\u0435\u0442\u043A\u0438 \u0438\u0441\u0442\u0451\u043A"
    };
  }
}
async function createMarkingRequest(data) {
  const id = v4();
  await executeQuery(
    `INSERT INTO attendance_marking_requests 
     (id, schedule_event_id, instructor_id, reason, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [id, data.scheduleEventId, data.instructorId, data.reason]
  );
  return await getMarkingRequestById(id);
}
async function getMarkingRequestById(id) {
  const rows = await executeQuery(
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
async function getMarkingRequests(filters) {
  const conditions = [];
  const params = [];
  if (filters.status) {
    conditions.push("amr.status = ?");
    params.push(filters.status);
  }
  if (filters.instructorId) {
    conditions.push("amr.instructor_id = ?");
    params.push(filters.instructorId);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await executeQuery(
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
async function getPendingMarkingRequests() {
  return getMarkingRequests({ status: "pending" });
}
async function reviewMarkingRequest(id, reviewedBy, data) {
  const request = await getMarkingRequestById(id);
  if (!request) {
    return null;
  }
  const newStatus = data.approved ? "approved" : "rejected";
  await executeQuery(
    `UPDATE attendance_marking_requests 
     SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_comment = ?
     WHERE id = ?`,
    [newStatus, reviewedBy, data.comment || null, id]
  );
  if (data.approved) {
    await updateMarkingStatus(request.scheduleEventId, {
      status: "approved",
      approvedBy: reviewedBy
    });
  }
  return getMarkingRequestById(id);
}
async function getMarkingStatistics(instructorId) {
  await syncMarkingStatuses();
  const params = [];
  let instructorCondition = "";
  if (instructorId) {
    instructorCondition = "AND se.instructor_id = ?";
    params.push(instructorId);
  }
  const [stats] = await executeQuery(
    `SELECT 
      SUM(CASE WHEN ams.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN ams.status = 'overdue' THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN ams.status = 'late' OR ams.status = 'approved' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN ams.status = 'on_time' THEN 1 ELSE 0 END) as on_time
    FROM attendance_marking_status ams
    JOIN schedule_events se ON ams.schedule_event_id = se.id
    WHERE se.end_time <= NOW() ${instructorCondition}`,
    params
  );
  const requestParams = [];
  let requestCondition = "";
  if (instructorId) {
    requestCondition = "AND instructor_id = ?";
    requestParams.push(instructorId);
  }
  const [requestStats] = await executeQuery(
    `SELECT COUNT(*) as count FROM attendance_marking_requests WHERE status = 'pending' ${requestCondition}`,
    requestParams
  );
  return {
    pending: Number(stats?.pending || 0),
    overdue: Number(stats?.overdue || 0),
    late: Number(stats?.late || 0),
    onTime: Number(stats?.on_time || 0),
    pendingRequests: Number(requestStats?.count || 0)
  };
}
async function updateMarkedCount(scheduleEventId) {
  await executeQuery(
    `UPDATE attendance_marking_status ams
     SET marked_count = (
       SELECT COUNT(*) FROM attendance a WHERE a.schedule_event_id = ?
     )
     WHERE ams.schedule_event_id = ?`,
    [scheduleEventId, scheduleEventId]
  );
}

export { updateMarkedCount as a, getOverdueMarkings as b, checkMarkingAccess as c, getMarkingStatistics as d, ensureMarkingStatus as e, getPendingMarkingsForInstructor as f, getMarkingStatusByEventId as g, getPendingMarkingRequests as h, getMarkingRequests as i, createMarkingRequest as j, getMarkingRequestById as k, getAttendanceSettings as l, updateAttendanceSetting as m, getMarkingStatuses as n, reviewMarkingRequest as r, updateMarkingStatus as u };
//# sourceMappingURL=attendanceMarkingRepository.mjs.map
