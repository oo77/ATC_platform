import { f as executeQuery, k as executeTransaction } from './nitro.mjs';
import { v4 } from 'uuid';

function mapGroupRow(row) {
  return {
    id: row.id,
    code: row.code,
    courseId: row.course_id,
    startDate: row.start_date,
    endDate: row.end_date,
    classroom: row.classroom,
    description: row.description,
    isActive: Boolean(row.is_active),
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    course: row.course_name ? {
      id: row.course_id,
      name: row.course_name,
      shortName: row.course_short_name,
      code: row.course_code,
      totalHours: row.course_total_hours,
      certificateTemplateId: row.certificate_template_id,
      certificateValidityMonths: row.certificate_validity_months
    } : null
  };
}
async function getGroupById(id) {
  const rows = await executeQuery(
    `SELECT 
      g.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      c.certificate_template_id,
      c.certificate_validity_months
     FROM study_groups g
     LEFT JOIN courses c ON g.course_id = c.id
     WHERE g.id = ?`,
    [id]
  );
  if (!rows || rows.length === 0) {
    return null;
  }
  const group = mapGroupRow(rows[0]);
  const studentRows = await executeQuery(
    `SELECT 
       sgs.id as link_id,
       sgs.enrolled_at,
       s.id as student_id,
       s.full_name,
       s.pinfl,
       s.organization,
       s.department,
       s.position
     FROM study_group_students sgs
     JOIN students s ON sgs.student_id = s.id
     WHERE sgs.group_id = ?
     ORDER BY s.full_name`,
    [id]
  );
  if (studentRows && studentRows.length > 0) {
    group.students = studentRows.map((row) => ({
      id: row.link_id,
      groupId: group.id,
      studentId: row.student_id,
      enrolledAt: row.enrolled_at,
      student: {
        id: row.student_id,
        fullName: row.full_name,
        pinfl: row.pinfl,
        organization: row.organization,
        department: row.department,
        position: row.position
      }
    }));
    group.studentCount = studentRows.length;
  } else {
    group.students = [];
    group.studentCount = 0;
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
  if (data.isArchived !== void 0) {
    updates.push("is_archived = ?");
    params.push(data.isArchived);
  }
  if (data.archivedAt !== void 0) {
    updates.push("archived_at = ?");
    params.push(data.archivedAt);
  }
  if (data.archivedBy !== void 0) {
    updates.push("archived_by = ?");
    params.push(data.archivedBy);
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
    await connection.execute("DELETE FROM schedule_events WHERE group_id = ?", [
      id
    ]);
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
  return (rows || []).map((row) => ({
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
  const totalResult = await executeQuery(
    `SELECT COUNT(*) as total FROM study_groups WHERE 1=1 ${groupCondition}`,
    groupParams
  );
  const activeResult = await executeQuery(
    `SELECT COUNT(*) as total FROM study_groups WHERE is_active = true AND end_date >= ? ${groupCondition}`,
    [today, ...groupParams]
  );
  const completedResult = await executeQuery(
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
  const studentsResult = await executeQuery(
    studentsQuery,
    studentsParams
  );
  return {
    total: totalResult[0]?.total || 0,
    active: activeResult[0]?.total || 0,
    completed: completedResult[0]?.total || 0,
    totalStudents: studentsResult[0]?.total || 0
  };
}
async function getGroups(params) {
  const { page = 1, limit = 10, filters = {} } = params;
  const offset = (page - 1) * limit;
  const conditions = [];
  const queryParams = [];
  if (filters.search) {
    conditions.push("(g.code LIKE ? OR g.description LIKE ?)");
    queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.courseId) {
    conditions.push("g.course_id = ?");
    queryParams.push(filters.courseId);
  }
  if (filters.isActive !== void 0) {
    conditions.push("g.is_active = ?");
    queryParams.push(filters.isActive ? 1 : 0);
  }
  if (filters.isArchived !== void 0) {
    conditions.push("g.is_archived = ?");
    queryParams.push(filters.isArchived ? 1 : 0);
  }
  if (filters.startDateFrom) {
    conditions.push("g.start_date >= ?");
    queryParams.push(filters.startDateFrom);
  }
  if (filters.startDateTo) {
    conditions.push("g.start_date <= ?");
    queryParams.push(filters.startDateTo);
  }
  if (filters.groupIds && filters.groupIds.length > 0) {
    const placeholders = filters.groupIds.map(() => "?").join(", ");
    conditions.push(`g.id IN (${placeholders})`);
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
  let countQuery = `SELECT COUNT(*) as total FROM study_groups g`;
  if (conditions.length > 0) {
    countQuery += ` WHERE ${conditions.join(" AND ")}`;
  }
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  let query = `
    SELECT 
      g.*,
      c.name as course_name,
      c.short_name as course_short_name,
      c.code as course_code,
      c.total_hours as course_total_hours,
      (SELECT COUNT(*) FROM study_group_students sgs WHERE sgs.group_id = g.id) as student_count
    FROM study_groups g
    LEFT JOIN courses c ON g.course_id = c.id
  `;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += ` ORDER BY g.created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);
  const rows = await executeQuery(query, queryParams);
  const data = (rows || []).map((row) => {
    const group = mapGroupRow(row);
    group.studentCount = row.student_count;
    return group;
  });
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
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
  return rows?.length > 0;
}
async function courseExists(id) {
  const rows = await executeQuery(
    "SELECT 1 FROM courses WHERE id = ? LIMIT 1",
    [id]
  );
  return rows?.length > 0;
}

export { groupCodeExists as a, checkStudentConflicts as b, courseExists as c, deleteGroup as d, addStudentsToGroup as e, getGroups as f, getGroupById as g, getGroupsStats as h, getGroupsForSelect as i, removeStudentFromGroup as r, transferStudent as t, updateGroup as u };
//# sourceMappingURL=groupRepository.mjs.map
