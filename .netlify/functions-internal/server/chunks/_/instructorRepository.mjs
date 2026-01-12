import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToInstructor(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    hireDate: row.hire_date,
    contractInfo: row.contract_info,
    maxHours: row.max_hours || 0,
    isActive: Boolean(row.is_active),
    userId: row.user_id,
    // ID связанной учётной записи
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    disciplineCount: row.discipline_count
  };
}
async function getAllInstructors(activeOnly = true) {
  const query = activeOnly ? "SELECT * FROM instructors WHERE is_active = true ORDER BY full_name" : "SELECT * FROM instructors ORDER BY full_name";
  const rows = await executeQuery(query);
  return rows.map(mapRowToInstructor);
}
async function getInstructorsPaginated(params = {}) {
  const { page = 1, limit = 10, filters = {} } = params;
  const { search, isActive } = filters;
  const conditions = [];
  const queryParams = [];
  if (search) {
    conditions.push("(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  if (isActive !== void 0) {
    conditions.push("is_active = ?");
    queryParams.push(isActive);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await executeQuery(
    `SELECT COUNT(*) as total FROM instructors ${whereClause}`,
    queryParams
  );
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT i.*,
           (SELECT COUNT(DISTINCT di.discipline_id) FROM discipline_instructors di WHERE di.instructor_id = i.id) as discipline_count
    FROM instructors i
    ${whereClause}
    ORDER BY i.full_name
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery(dataQuery, [...queryParams, limit, offset]);
  return {
    data: rows.map(mapRowToInstructor),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getInstructorById(id) {
  const rows = await executeQuery(
    "SELECT * FROM instructors WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length > 0 ? mapRowToInstructor(rows[0]) : null;
}
async function instructorEmailExists(email, excludeId) {
  if (!email) return false;
  let query = "SELECT 1 FROM instructors WHERE email = ?";
  const params = [email];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function createInstructor(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  let hireDate = null;
  if (data.hireDate) {
    hireDate = typeof data.hireDate === "string" ? new Date(data.hireDate) : data.hireDate;
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
  if (!instructor) throw new Error("Failed to create instructor");
  return instructor;
}
async function updateInstructor(id, data) {
  const existing = await getInstructorById(id);
  if (!existing) return null;
  const updates = [];
  const params = [];
  if (data.fullName !== void 0) {
    updates.push("full_name = ?");
    params.push(data.fullName);
  }
  if (data.email !== void 0) {
    updates.push("email = ?");
    params.push(data.email ?? null);
  }
  if (data.phone !== void 0) {
    updates.push("phone = ?");
    params.push(data.phone ?? null);
  }
  if (data.hireDate !== void 0) {
    updates.push("hire_date = ?");
    const hireDate = data.hireDate ? typeof data.hireDate === "string" ? new Date(data.hireDate) : data.hireDate : null;
    params.push(hireDate);
  }
  if (data.contractInfo !== void 0) {
    updates.push("contract_info = ?");
    params.push(data.contractInfo ?? null);
  }
  if (data.maxHours !== void 0) {
    updates.push("max_hours = ?");
    params.push(data.maxHours ?? 0);
  }
  if (data.isActive !== void 0) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }
  if (updates.length === 0) return existing;
  params.push(id);
  await executeQuery(
    `UPDATE instructors SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getInstructorById(id);
}
async function deleteInstructor(id) {
  const result = await executeQuery(
    "DELETE FROM instructors WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function linkInstructorToUser(instructorId, userId) {
  await executeQuery(
    "UPDATE instructors SET user_id = ? WHERE id = ?",
    [userId, instructorId]
  );
}
async function getInstructorHoursStats(instructorId) {
  const instructor = await getInstructorById(instructorId);
  if (!instructor) return null;
  console.log("[InstructorHours] \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u0434\u043B\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430:", instructorId);
  const dateFormat = "%Y-%m";
  const usedByMonthRows = await executeQuery(
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
  const totalUsedRows = await executeQuery(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)), 0) AS total_minutes, 
            COUNT(DISTINCT se.id) AS event_count 
     FROM schedule_events se 
     WHERE se.instructor_id = ? 
       AND EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)`,
    [instructorId]
  );
  console.log("[InstructorHours] \u041E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u043D\u044F\u0442\u0438\u0439:", totalUsedRows[0]?.event_count || 0);
  console.log("[InstructorHours] \u041E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0445 \u043C\u0438\u043D\u0443\u0442:", totalUsedRows[0]?.total_minutes || 0);
  const scheduledByMonthRows = await executeQuery(
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
  const totalScheduledRows = await executeQuery(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)), 0) AS total_minutes, 
            COUNT(DISTINCT se.id) AS event_count 
     FROM schedule_events se 
     WHERE se.instructor_id = ? 
       AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.schedule_event_id = se.id)`,
    [instructorId]
  );
  console.log("[InstructorHours] \u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u043D\u044F\u0442\u0438\u0439:", totalScheduledRows[0]?.event_count || 0);
  console.log("[InstructorHours] \u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u043C\u0438\u043D\u0443\u0442:", totalScheduledRows[0]?.total_minutes || 0);
  const totalAllRows = await executeQuery(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) AS total_minutes, COUNT(*) AS event_count FROM schedule_events WHERE instructor_id = ?`,
    [instructorId]
  );
  console.log("[InstructorHours] \u0412\u0441\u0435\u0433\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u0439:", totalAllRows[0]?.event_count || 0);
  const monthNames = [
    "\u042F\u043D\u0432\u0430\u0440\u044C",
    "\u0424\u0435\u0432\u0440\u0430\u043B\u044C",
    "\u041C\u0430\u0440\u0442",
    "\u0410\u043F\u0440\u0435\u043B\u044C",
    "\u041C\u0430\u0439",
    "\u0418\u044E\u043D\u044C",
    "\u0418\u044E\u043B\u044C",
    "\u0410\u0432\u0433\u0443\u0441\u0442",
    "\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044C",
    "\u041E\u043A\u0442\u044F\u0431\u0440\u044C",
    "\u041D\u043E\u044F\u0431\u0440\u044C",
    "\u0414\u0435\u043A\u0430\u0431\u0440\u044C"
  ];
  const monthMap = /* @__PURE__ */ new Map();
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
  const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const byMonth = sortedMonths.map(([yearMonth, data]) => {
    const [year, month] = yearMonth.split("-").map(Number);
    return {
      yearMonth,
      year,
      month,
      monthName: monthNames[month - 1] || "",
      usedHours: Math.round(data.usedMinutes / 45 * 10) / 10,
      // Академические часы (45 мин)
      scheduledHours: Math.round(data.scheduledMinutes / 45 * 10) / 10,
      eventCount: data.usedEvents + data.scheduledEvents
    };
  });
  const totalUsedMinutes = Number(totalUsedRows[0]?.total_minutes || 0);
  const totalScheduledMinutes = Number(totalScheduledRows[0]?.total_minutes || 0);
  const totalUsedHours = Math.round(totalUsedMinutes / 45 * 10) / 10;
  const totalScheduledHours = Math.round(totalScheduledMinutes / 45 * 10) / 10;
  const totalHoursPlanned = totalUsedHours + totalScheduledHours;
  const remainingHours = Math.max(0, instructor.maxHours - totalHoursPlanned);
  const usagePercentage = instructor.maxHours > 0 ? Math.round(totalHoursPlanned / instructor.maxHours * 100) : 0;
  console.log("[InstructorHours] \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442:", {
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
    byMonth
  };
}
async function checkInstructorHoursLimit(instructorId, additionalMinutes) {
  const stats = await getInstructorHoursStats(instructorId);
  if (!stats) {
    return {
      canTake: false,
      remainingHours: 0,
      requestedHours: 0,
      message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
    };
  }
  if (stats.maxHours === 0) {
    return {
      canTake: true,
      remainingHours: Infinity,
      requestedHours: Math.round(additionalMinutes / 45 * 10) / 10
    };
  }
  const requestedHours = Math.round(additionalMinutes / 45 * 10) / 10;
  const canTake = requestedHours <= stats.remainingHours;
  return {
    canTake,
    remainingHours: stats.remainingHours,
    requestedHours,
    message: canTake ? void 0 : `\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0447\u0430\u0441\u043E\u0432 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430! \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ${stats.remainingHours} \u0447., \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044F: ${requestedHours} \u0447.`
  };
}

export { getInstructorHoursStats as a, getAllInstructors as b, checkInstructorHoursLimit as c, deleteInstructor as d, getInstructorsPaginated as e, createInstructor as f, getInstructorById as g, instructorEmailExists as i, linkInstructorToUser as l, updateInstructor as u };
//# sourceMappingURL=instructorRepository.mjs.map
