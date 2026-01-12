import { e as executeQuery, p as executeTransaction } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function mapRowToGroup(row) {
  const group = {
    id: row.id,
    code: row.code,
    courseId: row.course_id,
    // Форматируем даты как строки YYYY-MM-DD для избежания сдвига при сериализации
    startDate: formatDateLocal(row.start_date),
    endDate: formatDateLocal(row.end_date),
    classroom: row.classroom,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.course_name) {
    group.course = {
      id: row.course_id,
      name: row.course_name,
      shortName: row.course_short_name || "",
      code: row.course_code || "",
      totalHours: row.course_total_hours || 0,
      certificateTemplateId: row.course_certificate_template_id || null,
      certificateValidityMonths: row.course_certificate_validity_months || null
    };
  }
  if (row.student_count !== void 0) {
    group.studentCount = row.student_count;
  }
  return group;
}
function mapRowToGroupStudent(row) {
  const gs = {
    id: row.id,
    groupId: row.group_id,
    studentId: row.student_id,
    enrolledAt: row.enrolled_at
  };
  if (row.student_full_name) {
    gs.student = {
      id: row.student_id,
      fullName: row.student_full_name,
      pinfl: row.student_pinfl || "",
      organization: row.student_organization || "",
      department: row.student_department || null,
      position: row.student_position || ""
    };
  }
  return gs;
}
async function getGroups(params = {}) {
  const { page = 1, limit = 10, filters = {} } = params;
  const conditions = [];
  const queryParams = [];
  if (filters.search) {
    conditions.push("(sg.code LIKE ? OR sg.description LIKE ? OR c.name LIKE ?)");
    const searchPattern = `%${filters.search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  if (filters.courseId) {
    conditions.push("sg.course_id = ?");
    queryParams.push(filters.courseId);
  }
  if (filters.isActive !== void 0) {
    conditions.push("sg.is_active = ?");
    queryParams.push(filters.isActive);
  }
  if (filters.startDateFrom) {
    conditions.push("sg.start_date >= ?");
    queryParams.push(filters.startDateFrom);
  }
  if (filters.startDateTo) {
    conditions.push("sg.start_date <= ?");
    queryParams.push(filters.startDateTo);
  }
  if (filters.groupIds && filters.groupIds.length > 0) {
    const placeholders = filters.groupIds.map(() => "?").join(", ");
    conditions.push(`sg.id IN (${placeholders})`);
    queryParams.push(...filters.groupIds);
  } else if (filters.groupIds && filters.groupIds.length === 0) {
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM study_groups sg
    LEFT JOIN courses c ON sg.course_id = c.id
    ${whereClause}
  `;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      sg.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      c.certificate_template_id as course_certificate_template_id,
      c.certificate_validity_months as course_certificate_validity_months,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = sg.id) as student_count
    FROM study_groups sg
    LEFT JOIN courses c ON sg.course_id = c.id
    ${whereClause}
    ORDER BY sg.start_date DESC, sg.code ASC
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery(dataQuery, dataParams);
  return {
    data: rows.map(mapRowToGroup),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getGroupById(id) {
  const rows = await executeQuery(
    `SELECT 
      sg.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      c.certificate_template_id as course_certificate_template_id,
      c.certificate_validity_months as course_certificate_validity_months,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = sg.id) as student_count
    FROM study_groups sg
    LEFT JOIN courses c ON sg.course_id = c.id
    WHERE sg.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  const group = mapRowToGroup(rows[0]);
  const studentRows = await executeQuery(
    `SELECT 
      sgs.*,
      s.full_name as student_full_name,
      s.pinfl as student_pinfl,
      s.organization as student_organization,
      s.department as student_department,
      s.position as student_position
    FROM study_group_students sgs
    JOIN students s ON sgs.student_id = s.id
    WHERE sgs.group_id = ?
    ORDER BY s.full_name`,
    [id]
  );
  group.students = studentRows.map(mapRowToGroupStudent);
  return group;
}
async function groupCodeExists(code, excludeId) {
  let query = "SELECT 1 FROM study_groups WHERE code = ?";
  const params = [code];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  query += " LIMIT 1";
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function courseExists(courseId) {
  const rows = await executeQuery(
    "SELECT 1 FROM courses WHERE id = ? LIMIT 1",
    [courseId]
  );
  return rows.length > 0;
}
async function createGroup(data) {
  const id = v4();
  await executeTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO study_groups (id, code, course_id, start_date, end_date, classroom, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.code,
        data.courseId,
        data.startDate,
        data.endDate,
        data.classroom || null,
        data.description || null,
        data.isActive !== false
      ]
    );
    if (data.studentIds && data.studentIds.length > 0) {
      for (const studentId of data.studentIds) {
        const gsId = v4();
        await connection.execute(
          `INSERT INTO study_group_students (id, group_id, student_id)
           VALUES (?, ?, ?)`,
          [gsId, id, studentId]
        );
      }
    }
  });
  const group = await getGroupById(id);
  if (!group) {
    throw new Error("Failed to create group");
  }
  return group;
}
async function updateGroup(id, data) {
  const existing = await getGroupById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.code !== void 0) {
    updates.push("code = ?");
    params.push(data.code);
  }
  if (data.courseId !== void 0) {
    updates.push("course_id = ?");
    params.push(data.courseId);
  }
  if (data.startDate !== void 0) {
    updates.push("start_date = ?");
    params.push(data.startDate);
  }
  if (data.endDate !== void 0) {
    updates.push("end_date = ?");
    params.push(data.endDate);
  }
  if (data.classroom !== void 0) {
    updates.push("classroom = ?");
    params.push(data.classroom);
  }
  if (data.description !== void 0) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.isActive !== void 0) {
    updates.push("is_active = ?");
    params.push(data.isActive);
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
async function deleteGroup(id) {
  return executeTransaction(async (connection) => {
    await connection.execute(
      "DELETE FROM schedule_events WHERE group_id = ?",
      [id]
    );
    await connection.execute(
      "DELETE FROM study_group_students WHERE group_id = ?",
      [id]
    );
    const [result] = await connection.execute(
      "DELETE FROM study_groups WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  });
}
async function checkStudentConflicts(studentIds, startDate, endDate, excludeGroupId) {
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
  const params = [...studentIds, endDate, startDate];
  if (excludeGroupId) {
    query += " AND sg.id != ?";
    params.push(excludeGroupId);
  }
  const rows = await executeQuery(query, params);
  return rows.map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    conflictGroupId: row.group_id,
    conflictGroupCode: row.group_code,
    conflictStartDate: row.start_date,
    conflictEndDate: row.end_date
  }));
}
async function addStudentsToGroup(groupId, studentIds) {
  if (studentIds.length === 0) {
    return { added: [], alreadyInGroup: [] };
  }
  const added = [];
  const alreadyInGroup = [];
  await executeTransaction(async (connection) => {
    for (const studentId of studentIds) {
      const [existing] = await connection.execute(
        "SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1",
        [groupId, studentId]
      );
      if (existing.length > 0) {
        alreadyInGroup.push(studentId);
        continue;
      }
      const id = v4();
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
async function removeStudentFromGroup(groupId, studentId) {
  const result = await executeQuery(
    "DELETE FROM study_group_students WHERE group_id = ? AND student_id = ?",
    [groupId, studentId]
  );
  return result.affectedRows > 0;
}
async function transferStudent(studentId, fromGroupId, toGroupId) {
  return executeTransaction(async (connection) => {
    await connection.execute(
      "DELETE FROM study_group_students WHERE group_id = ? AND student_id = ?",
      [fromGroupId, studentId]
    );
    const [existing] = await connection.execute(
      "SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1",
      [toGroupId, studentId]
    );
    if (existing.length === 0) {
      const id = v4();
      await connection.execute(
        `INSERT INTO study_group_students (id, group_id, student_id)
         VALUES (?, ?, ?)`,
        [id, toGroupId, studentId]
      );
    }
    return true;
  });
}
async function getGroupsForSelect(excludeGroupId) {
  let query = `
    SELECT sg.id, sg.code, c.name as course_name
    FROM study_groups sg
    JOIN courses c ON sg.course_id = c.id
    WHERE sg.is_active = true
  `;
  const params = [];
  if (excludeGroupId) {
    query += " AND sg.id != ?";
    params.push(excludeGroupId);
  }
  query += " ORDER BY sg.code";
  const rows = await executeQuery(query, params);
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    courseName: row.course_name
  }));
}
async function getGroupsStats(groupIds) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let groupCondition = "";
  let groupParams = [];
  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(", ");
    groupCondition = `AND id IN (${placeholders})`;
    groupParams = groupIds;
  } else if (groupIds && groupIds.length === 0) {
    return { total: 0, active: 0, completed: 0, totalStudents: 0 };
  }
  const [totalResult] = await executeQuery(
    `SELECT COUNT(*) as total FROM study_groups WHERE 1=1 ${groupCondition}`,
    groupParams
  );
  const [activeResult] = await executeQuery(
    `SELECT COUNT(*) as total FROM study_groups WHERE is_active = true AND end_date >= ? ${groupCondition}`,
    [today, ...groupParams]
  );
  const [completedResult] = await executeQuery(
    `SELECT COUNT(*) as total FROM study_groups WHERE end_date < ? ${groupCondition}`,
    [today, ...groupParams]
  );
  let studentsQuery = "SELECT COUNT(DISTINCT student_id) as total FROM study_group_students";
  let studentsParams = [];
  if (groupIds && groupIds.length > 0) {
    const placeholders = groupIds.map(() => "?").join(", ");
    studentsQuery += ` WHERE group_id IN (${placeholders})`;
    studentsParams = groupIds;
  }
  const [studentsResult] = await executeQuery(studentsQuery, studentsParams);
  return {
    total: totalResult[0]?.total || 0,
    active: activeResult[0]?.total || 0,
    completed: completedResult[0]?.total || 0,
    totalStudents: studentsResult[0]?.total || 0
  };
}

export { groupCodeExists as a, checkStudentConflicts as b, courseExists as c, deleteGroup as d, addStudentsToGroup as e, getGroups as f, getGroupById as g, getGroupsStats as h, createGroup as i, getGroupsForSelect as j, removeStudentFromGroup as r, transferStudent as t, updateGroup as u };
//# sourceMappingURL=groupRepository.mjs.map
