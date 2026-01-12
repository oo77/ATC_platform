import { e as executeQuery, u as getOrCreateOrganizationByName, p as executeTransaction, w as updateStudentsCount } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToStudent(row, certificates = []) {
  return {
    id: row.id,
    fullName: row.full_name,
    pinfl: row.pinfl,
    organization: row.organization,
    department: row.department,
    position: row.position,
    certificates,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToCertificate(row) {
  let courseName = row.course_name || "";
  if (!courseName && row.variables_data) {
    try {
      const varsData = JSON.parse(row.variables_data);
      courseName = varsData.courseName || varsData.course_name || "";
    } catch {
    }
  }
  return {
    id: row.id,
    studentId: row.student_id,
    groupId: row.group_id,
    templateId: row.template_id,
    courseName,
    groupCode: row.group_code || void 0,
    issueDate: row.issue_date,
    certificateNumber: row.certificate_number,
    fileUrl: row.pdf_file_url,
    expiryDate: row.expiry_date,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
async function getCertificatesByStudentId(studentId) {
  const rows = await executeQuery(
    `SELECT ic.*, 
            c.name as course_name,
            sg.code as group_code
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     WHERE ic.student_id = ? AND ic.status = 'issued'
     ORDER BY ic.issue_date DESC`,
    [studentId]
  );
  return rows.map(mapRowToCertificate);
}
async function getCertificatesByStudentIds(studentIds) {
  if (studentIds.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const placeholders = studentIds.map(() => "?").join(", ");
  const rows = await executeQuery(
    `SELECT ic.*, 
            c.name as course_name,
            sg.code as group_code
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     WHERE ic.student_id IN (${placeholders}) AND ic.status = 'issued'
     ORDER BY ic.issue_date DESC`,
    studentIds
  );
  const certificatesMap = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const cert = mapRowToCertificate(row);
    const existing = certificatesMap.get(cert.studentId) || [];
    existing.push(cert);
    certificatesMap.set(cert.studentId, existing);
  }
  return certificatesMap;
}
async function getAllStudents() {
  const rows = await executeQuery("SELECT * FROM students ORDER BY full_name");
  if (rows.length === 0) {
    return [];
  }
  const studentIds = rows.map((r) => r.id);
  const certificatesMap = await getCertificatesByStudentIds(studentIds);
  return rows.map((row) => mapRowToStudent(row, certificatesMap.get(row.id) || []));
}
async function getStudentsPaginated(params = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    fullName,
    pinfl,
    organization,
    position,
    hasCertificates,
    noCertificates
  } = params;
  const conditions = [];
  const queryParams = [];
  if (search) {
    conditions.push("(full_name LIKE ? OR pinfl LIKE ? OR organization LIKE ? OR position LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  if (fullName) {
    conditions.push("full_name LIKE ?");
    queryParams.push(`%${fullName}%`);
  }
  if (pinfl) {
    conditions.push("pinfl LIKE ?");
    queryParams.push(`%${pinfl}%`);
  }
  if (organization) {
    conditions.push("organization LIKE ?");
    queryParams.push(`%${organization}%`);
  }
  if (position) {
    conditions.push("position LIKE ?");
    queryParams.push(`%${position}%`);
  }
  if (hasCertificates) {
    conditions.push(`EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`);
  }
  if (noCertificates) {
    conditions.push(`NOT EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM students ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT * FROM students 
    ${whereClause} 
    ORDER BY full_name 
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery(dataQuery, dataParams);
  let students = [];
  if (rows.length > 0) {
    const studentIds = rows.map((r) => r.id);
    const certificatesMap = await getCertificatesByStudentIds(studentIds);
    students = rows.map((row) => mapRowToStudent(row, certificatesMap.get(row.id) || []));
  }
  return {
    data: students,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getStudentById(id) {
  const rows = await executeQuery(
    "SELECT * FROM students WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  const certificates = await getCertificatesByStudentId(id);
  return mapRowToStudent(rows[0], certificates);
}
async function getStudentByPinfl(pinfl) {
  const rows = await executeQuery(
    "SELECT * FROM students WHERE pinfl = ? LIMIT 1",
    [pinfl]
  );
  if (rows.length === 0) {
    return null;
  }
  const certificates = await getCertificatesByStudentId(rows[0].id);
  return mapRowToStudent(rows[0], certificates);
}
async function studentExistsByPinfl(pinfl, excludeId) {
  let query = "SELECT 1 FROM students WHERE pinfl = ?";
  const params = [pinfl];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  query += " LIMIT 1";
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function createStudent(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO students (id, full_name, pinfl, organization, department, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.fullName, data.pinfl, data.organization, data.department || null, data.position, now, now]
  );
  const student = await getStudentById(id);
  if (!student) {
    throw new Error("Failed to create student");
  }
  return student;
}
async function updateStudent(id, data) {
  const existing = await getStudentById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.fullName !== void 0) {
    updates.push("full_name = ?");
    params.push(data.fullName);
  }
  if (data.pinfl !== void 0) {
    updates.push("pinfl = ?");
    params.push(data.pinfl);
  }
  if (data.organization !== void 0) {
    updates.push("organization = ?");
    params.push(data.organization);
  }
  if (data.department !== void 0) {
    updates.push("department = ?");
    params.push(data.department || null);
  }
  if (data.position !== void 0) {
    updates.push("position = ?");
    params.push(data.position);
  }
  if (updates.length === 0) {
    return existing;
  }
  params.push(id);
  await executeQuery(
    `UPDATE students SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getStudentById(id);
}
async function deleteStudent(id) {
  const result = await executeQuery(
    "DELETE FROM students WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function linkStudentToUser(studentId, userId) {
  await executeQuery(
    "UPDATE students SET user_id = ? WHERE id = ?",
    [userId, studentId]
  );
}
async function getStudentByUserId(userId) {
  const rows = await executeQuery(
    "SELECT * FROM students WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) {
    return null;
  }
  const certificates = await getCertificatesByStudentId(rows[0].id);
  return mapRowToStudent(rows[0], certificates);
}
async function batchUpsertStudentsWithProgress(students, onProgress, batchSize = 100) {
  const result = {
    created: 0,
    updated: 0,
    errors: [],
    organizationsCreated: 0,
    accountsCreated: 0
  };
  if (students.length === 0) {
    return result;
  }
  const { hashPassword } = await import('../nitro/nitro.mjs').then(function (n) { return n.ap; });
  const organizationCache = /* @__PURE__ */ new Map();
  const affectedOrganizationIds = /* @__PURE__ */ new Set();
  const uniqueOrganizations = [...new Set(students.map((s) => s.organization.trim()))];
  for (const orgName of uniqueOrganizations) {
    try {
      const org = await getOrCreateOrganizationByName(orgName);
      organizationCache.set(orgName, org.id);
      if (org.studentsCount === 0) {
        result.organizationsCreated++;
      }
    } catch (error) {
      console.error(`Error creating organization "${orgName}":`, error);
    }
  }
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    await executeTransaction(async (connection) => {
      for (const student of batch) {
        try {
          const organizationId = organizationCache.get(student.organization.trim()) || null;
          const [existingRows] = await connection.execute(
            "SELECT id, organization_id, user_id FROM students WHERE pinfl = ? LIMIT 1",
            [student.pinfl]
          );
          if (existingRows.length > 0) {
            const existingOrgId = existingRows[0].organization_id;
            await connection.execute(
              `UPDATE students 
               SET full_name = ?, organization = ?, organization_id = ?, department = ?, position = ?, updated_at = ?
               WHERE pinfl = ?`,
              [student.fullName, student.organization, organizationId, student.department || null, student.position, /* @__PURE__ */ new Date(), student.pinfl]
            );
            result.updated++;
            if (organizationId) affectedOrganizationIds.add(organizationId);
            if (existingOrgId && existingOrgId !== organizationId) affectedOrganizationIds.add(existingOrgId);
          } else {
            const studentId = v4();
            const now = /* @__PURE__ */ new Date();
            const email = `${student.pinfl}@student.local`;
            const password = student.pinfl;
            const passwordHash = await hashPassword(password);
            const [existingUserRows] = await connection.execute(
              "SELECT id FROM users WHERE email = ? LIMIT 1",
              [email]
            );
            let userId = null;
            if (existingUserRows.length === 0) {
              userId = v4();
              await connection.execute(
                `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
                 VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
                [userId, student.fullName, email, passwordHash, student.pinfl, student.organization, student.position]
              );
              result.accountsCreated++;
            } else {
              userId = existingUserRows[0].id;
            }
            await connection.execute(
              `INSERT INTO students (id, full_name, pinfl, organization, organization_id, department, position, user_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [studentId, student.fullName, student.pinfl, student.organization, organizationId, student.department || null, student.position, userId, now, now]
            );
            result.created++;
            if (organizationId) affectedOrganizationIds.add(organizationId);
          }
        } catch (error) {
          result.errors.push({
            pinfl: student.pinfl,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    });
    if (onProgress) {
      onProgress(
        Math.min(i + batchSize, students.length),
        result.created,
        result.updated,
        result.errors.length
      );
    }
    if (i + batchSize < students.length) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  for (const orgId of affectedOrganizationIds) {
    try {
      await updateStudentsCount(orgId);
    } catch (error) {
      console.error(`Error updating students count for organization ${orgId}:`, error);
    }
  }
  return result;
}

export { getStudentById as a, getAllStudents as b, createStudent as c, deleteStudent as d, batchUpsertStudentsWithProgress as e, getStudentsPaginated as f, getStudentByPinfl as g, getStudentByUserId as h, linkStudentToUser as l, studentExistsByPinfl as s, updateStudent as u };
//# sourceMappingURL=studentRepository.mjs.map
