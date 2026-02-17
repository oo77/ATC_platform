import { f as executeQuery, z as getOrCreateOrganizationByName, k as executeTransaction, A as updateStudentsCount } from './nitro.mjs';
import { v4 } from 'uuid';

function mapRowToStudent(row, certificates = []) {
  return {
    id: row.id,
    fullName: row.full_name,
    pinfl: row.pinfl,
    organization: row.organization,
    organizationUz: row.name_uz,
    organizationEn: row.name_en,
    organizationRu: row.name_ru,
    department: row.department,
    position: row.position,
    certificates,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToCertificate(row) {
  let courseName = row.course_name || "";
  let courseCode = row.course_code || "";
  let courseHours = row.course_hours || null;
  if (!courseName && row.variables_data) {
    try {
      const varsData = JSON.parse(
        typeof row.variables_data === "string" ? row.variables_data : JSON.stringify(row.variables_data)
      );
      if (!courseName)
        courseName = varsData.courseName || varsData.course_name || "";
      if (!courseCode)
        courseCode = varsData.courseCode || varsData.course_code || "";
    } catch {
    }
  }
  const course = {
    name: courseName || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
    code: courseCode || null,
    hours: courseHours
  };
  const group = {
    id: row.group_id,
    code: row.group_code || null,
    startDate: row.group_start_date,
    endDate: row.group_end_date
  };
  const template = row.template_id ? {
    id: row.template_id,
    name: row.template_name
  } : null;
  const issuedBy = row.issued_by ? {
    id: row.issued_by,
    name: row.issued_by_name
  } : null;
  let hasWarnings = false;
  if (row.warnings) {
    try {
      const w = typeof row.warnings === "string" ? JSON.parse(row.warnings) : row.warnings;
      if (Array.isArray(w) && w.length > 0) hasWarnings = true;
    } catch {
    }
  }
  return {
    id: row.id,
    studentId: row.student_id,
    groupId: row.group_id,
    templateId: row.template_id,
    // Flat fields (keeping for backward compatibility if needed)
    courseName,
    groupCode: row.group_code || void 0,
    issueDate: row.issue_date,
    certificateNumber: row.certificate_number,
    fileUrl: row.pdf_file_url,
    docxFileUrl: row.docx_file_url,
    // Added
    expiryDate: row.expiry_date,
    status: row.status,
    // Rich objects (for Modal)
    course,
    group,
    template,
    issuedBy,
    // Audit & Extra
    issuedAt: row.issued_at,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
    notes: row.notes,
    hasWarnings,
    sourceType: row.source_type,
    importSource: row.import_source,
    aiConfidence: row.ai_confidence,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
async function getCertificatesByStudentId(studentId) {
  const rows = await executeQuery(
    `SELECT 
      ic.*, 
      COALESCE(c.name, ic.course_name) as course_name,
      COALESCE(c.code, ic.course_code) as course_code,
      COALESCE(ic.course_hours, NULL) as course_hours, -- TODO: Join disciplines hours if needed, but usually course total
      COALESCE(sg.code, ic.group_code) as group_code,
      COALESCE(sg.start_date, ic.group_start_date) as group_start_date,
      COALESCE(sg.end_date, ic.group_end_date) as group_end_date,
      ct.name as template_name,
      u.name as issued_by_name
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
     LEFT JOIN users u ON ic.issued_by = u.id
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
    `SELECT 
      ic.*, 
      COALESCE(c.name, ic.course_name) as course_name,
      COALESCE(c.code, ic.course_code) as course_code,
      COALESCE(ic.course_hours, NULL) as course_hours,
      COALESCE(sg.code, ic.group_code) as group_code,
      COALESCE(sg.start_date, ic.group_start_date) as group_start_date,
      COALESCE(sg.end_date, ic.group_end_date) as group_end_date,
      ct.name as template_name,
      u.name as issued_by_name
     FROM issued_certificates ic
     LEFT JOIN study_groups sg ON ic.group_id = sg.id
     LEFT JOIN courses c ON sg.course_id = c.id
     LEFT JOIN certificate_templates ct ON ic.template_id = ct.id
     LEFT JOIN users u ON ic.issued_by = u.id
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
  const rows = await executeQuery(
    "SELECT * FROM students ORDER BY full_name"
  );
  if (rows.length === 0) {
    return [];
  }
  const studentIds = rows.map((r) => r.id);
  const certificatesMap = await getCertificatesByStudentIds(studentIds);
  return rows.map(
    (row) => mapRowToStudent(row, certificatesMap.get(row.id) || [])
  );
}
async function getStudentsByOrganizationId(organizationId) {
  const rows = await executeQuery(
    "SELECT * FROM students WHERE organization_id = ? ORDER BY full_name",
    [organizationId]
  );
  if (rows.length === 0) {
    return [];
  }
  const studentIds = rows.map((r) => r.id);
  const certificatesMap = await getCertificatesByStudentIds(studentIds);
  return rows.map(
    (row) => mapRowToStudent(row, certificatesMap.get(row.id) || [])
  );
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
    conditions.push(
      "(full_name LIKE ? OR pinfl LIKE ? OR organization LIKE ? OR position LIKE ?)"
    );
    const searchPattern = `%${search}%`;
    queryParams.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
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
    conditions.push(
      `EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`
    );
  }
  if (noCertificates) {
    conditions.push(
      `NOT EXISTS (SELECT 1 FROM issued_certificates ic WHERE ic.student_id = students.id AND ic.status = 'issued')`
    );
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
    students = rows.map(
      (row) => mapRowToStudent(row, certificatesMap.get(row.id) || [])
    );
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
    `SELECT s.*, o.name_uz, o.name_en, o.name_ru 
     FROM students s
     LEFT JOIN organizations o ON s.organization_id = o.id 
     WHERE s.id = ? 
     LIMIT 1`,
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
async function getExistingStudentsByPinfls(pinfls) {
  if (pinfls.length === 0) {
    return [];
  }
  const placeholders = pinfls.map(() => "?").join(", ");
  const query = `SELECT * FROM students WHERE pinfl IN (${placeholders})`;
  const rows = await executeQuery(query, pinfls);
  return rows;
}
async function createStudent(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  const org = await getOrCreateOrganizationByName(data.organization, {
    nameUz: data.organizationUz,
    nameEn: data.organizationEn,
    nameRu: data.organizationRu
  });
  await executeQuery(
    `INSERT INTO students (id, full_name, pinfl, organization, organization_id, department, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.fullName,
      data.pinfl,
      data.organization,
      org.id,
      data.department || null,
      data.position,
      now,
      now
    ]
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
    const org = await getOrCreateOrganizationByName(data.organization, {
      nameUz: data.organizationUz,
      nameEn: data.organizationEn,
      nameRu: data.organizationRu
    });
    updates.push("organization_id = ?");
    params.push(org.id);
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
  await executeQuery("UPDATE students SET user_id = ? WHERE id = ?", [
    userId,
    studentId
  ]);
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
  const { hashPassword } = await import('./nitro.mjs').then(function (n) { return n.aJ; });
  const organizationCache = /* @__PURE__ */ new Map();
  const affectedOrganizationIds = /* @__PURE__ */ new Set();
  const uniqueOrganizations = [
    ...new Set(students.map((s) => s.organization.trim()))
  ];
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
    const batchPinfls = batch.map((s) => s.pinfl);
    await executeTransaction(async (connection) => {
      try {
        const placeholders = batchPinfls.map(() => "?").join(",");
        const [existingStudentRows] = await connection.query(
          `SELECT id, pinfl, user_id, organization_id FROM students WHERE pinfl IN (${placeholders})`,
          batchPinfls
        );
        const existingStudentsMap = /* @__PURE__ */ new Map();
        existingStudentRows.forEach(
          (row) => existingStudentsMap.set(row.pinfl, row)
        );
        const emailsToCheck = [];
        const pinflsOfNewUsers = [];
        batch.forEach((student) => {
          const existing = existingStudentsMap.get(student.pinfl);
          if (!existing || !existing.user_id) {
            emailsToCheck.push(`${student.pinfl}@student.local`);
            pinflsOfNewUsers.push(student.pinfl);
          }
        });
        const userMap = /* @__PURE__ */ new Map();
        if (emailsToCheck.length > 0) {
          const emailPlaceholders = emailsToCheck.map(() => "?").join(",");
          const [existingUserRows] = await connection.query(
            `SELECT id, email FROM users WHERE email IN (${emailPlaceholders})`,
            emailsToCheck
          );
          existingUserRows.forEach(
            (row) => userMap.set(row.email, row.id)
          );
          const usersToCreate = [];
          for (const pinfl of pinflsOfNewUsers) {
            const email = `${pinfl}@student.local`;
            if (!userMap.has(email)) {
              usersToCreate.push({
                id: v4(),
                pinfl,
                email,
                fullName: batch.find((s) => s.pinfl === pinfl)?.fullName || "",
                organization: batch.find((s) => s.pinfl === pinfl)?.organization || "",
                position: batch.find((s) => s.pinfl === pinfl)?.position || ""
              });
            }
          }
          if (usersToCreate.length > 0) {
            const passwordHashes = await Promise.all(
              usersToCreate.map((u) => hashPassword(u.pinfl))
            );
            const userValues = [];
            const userPlaceholders = usersToCreate.map((u, idx) => {
              userValues.push(
                u.id,
                "STUDENT",
                u.fullName,
                u.email,
                passwordHashes[idx],
                u.pinfl,
                u.organization,
                u.position,
                /* @__PURE__ */ new Date(),
                /* @__PURE__ */ new Date()
              );
              userMap.set(u.email, u.id);
              return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            }).join(",");
            await connection.query(
              `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at) VALUES ${userPlaceholders}`,
              userValues
            );
            result.accountsCreated += usersToCreate.length;
          }
        }
        const upsertValues = [];
        const upsertPlaceholders = batch.map((student) => {
          const existing = existingStudentsMap.get(student.pinfl);
          const organizationId = organizationCache.get(student.organization.trim()) || null;
          const studentId = existing ? existing.id : v4();
          const email = `${student.pinfl}@student.local`;
          const userId = existing?.user_id || userMap.get(email) || null;
          const now = /* @__PURE__ */ new Date();
          upsertValues.push(
            studentId,
            student.fullName,
            student.pinfl,
            student.organization,
            organizationId,
            student.department || null,
            student.position,
            userId,
            now,
            // created_at
            now
            // updated_at
          );
          if (existing) {
            result.updated++;
            if (existing.organization_id && existing.organization_id !== organizationId) {
              affectedOrganizationIds.add(existing.organization_id);
            }
          } else {
            result.created++;
          }
          if (organizationId) affectedOrganizationIds.add(organizationId);
          return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        }).join(",");
        const query = `
            INSERT INTO students 
            (id, full_name, pinfl, organization, organization_id, department, position, user_id, created_at, updated_at) 
            VALUES ${upsertPlaceholders} 
            ON DUPLICATE KEY UPDATE 
            full_name = VALUES(full_name),
            organization = VALUES(organization),
            organization_id = VALUES(organization_id),
            department = VALUES(department),
            position = VALUES(position),
            user_id = VALUES(user_id),
            updated_at = VALUES(updated_at)
        `;
        await connection.query(query, upsertValues);
      } catch (error) {
        console.error("Batch import error:", error);
        batch.forEach((item) => {
          result.errors.push({
            pinfl: item.pinfl,
            error: error instanceof Error ? error.message : "Batch processing error"
          });
        });
        result.created -= batch.filter(
          (s) => !result.errors.find((e) => e.pinfl === s.pinfl)
        ).length;
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
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  for (const orgId of affectedOrganizationIds) {
    try {
      await updateStudentsCount(orgId);
    } catch (error) {
      console.error(
        `Error updating students count for organization ${orgId}:`,
        error
      );
    }
  }
  return result;
}

export { getStudentsPaginated as a, getStudentByPinfl as b, createStudent as c, getStudentById as d, deleteStudent as e, getExistingStudentsByPinfls as f, getAllStudents as g, batchUpsertStudentsWithProgress as h, getStudentByUserId as i, getStudentsByOrganizationId as j, linkStudentToUser as l, studentExistsByPinfl as s, updateStudent as u };
//# sourceMappingURL=studentRepository.mjs.map
