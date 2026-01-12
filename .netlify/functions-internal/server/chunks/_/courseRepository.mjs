import { e as executeQuery, p as executeTransaction } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToCourse(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    code: row.code,
    description: row.description,
    totalHours: row.total_hours,
    certificateTemplateId: row.certificate_template_id,
    certificateValidityMonths: row.certificate_validity_months,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapRowToCertificateTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateFileUrl: row.template_file_url,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapRowToDiscipline(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    description: row.description,
    hours: row.hours,
    theoryHours: row.theory_hours,
    practiceHours: row.practice_hours,
    assessmentHours: row.assessment_hours,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getAllCertificateTemplates() {
  const rows = await executeQuery(
    "SELECT * FROM certificate_templates WHERE is_active = true ORDER BY name"
  );
  return rows.map(mapRowToCertificateTemplate);
}
async function getCertificateTemplateById(id) {
  const rows = await executeQuery(
    "SELECT * FROM certificate_templates WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length > 0 ? mapRowToCertificateTemplate(rows[0]) : null;
}
async function getDisciplinesByCourseId(courseId) {
  const rows = await executeQuery(
    "SELECT * FROM disciplines WHERE course_id = ? ORDER BY order_index, name",
    [courseId]
  );
  if (rows.length === 0) return [];
  const disciplineIds = rows.map((r) => r.id);
  const instructorsMap = await getDisciplineInstructors(disciplineIds);
  return rows.map((row) => ({
    ...mapRowToDiscipline(row),
    instructors: instructorsMap.get(row.id) || []
  }));
}
async function getDisciplineInstructors(disciplineIds) {
  if (disciplineIds.length === 0) return /* @__PURE__ */ new Map();
  const placeholders = disciplineIds.map(() => "?").join(", ");
  const rows = await executeQuery(
    `SELECT di.*, i.full_name as instructor_full_name, i.email as instructor_email
     FROM discipline_instructors di
     LEFT JOIN instructors i ON di.instructor_id = i.id
     WHERE di.discipline_id IN (${placeholders})`,
    disciplineIds
  );
  const result = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const instructor = {
      id: row.id,
      disciplineId: row.discipline_id,
      instructorId: row.instructor_id,
      isPrimary: Boolean(row.is_primary),
      createdAt: row.created_at,
      instructor: row.instructor_full_name ? {
        id: row.instructor_id,
        fullName: row.instructor_full_name,
        email: row.instructor_email || null,
        phone: null,
        isActive: true,
        createdAt: row.created_at,
        updatedAt: row.created_at
      } : void 0
    };
    const existing = result.get(row.discipline_id) || [];
    existing.push(instructor);
    result.set(row.discipline_id, existing);
  }
  return result;
}
async function getCoursesPaginated(params = {}) {
  const { page = 1, limit = 10, filters = {} } = params;
  const { search, isActive, certificateTemplateId } = filters;
  const conditions = [];
  const queryParams = [];
  if (search) {
    conditions.push("(name LIKE ? OR short_name LIKE ? OR code LIKE ? OR description LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  if (isActive !== void 0) {
    conditions.push("is_active = ?");
    queryParams.push(isActive);
  }
  if (certificateTemplateId) {
    conditions.push("certificate_template_id = ?");
    queryParams.push(certificateTemplateId);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await executeQuery(
    `SELECT COUNT(*) as total FROM courses ${whereClause}`,
    queryParams
  );
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT c.*, 
           (SELECT COUNT(*) FROM disciplines d WHERE d.course_id = c.id) as discipline_count
    FROM courses c
    ${whereClause}
    ORDER BY c.name
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery(
    dataQuery,
    [...queryParams, limit, offset]
  );
  const templateIds = [...new Set(rows.filter((r) => r.certificate_template_id).map((r) => r.certificate_template_id))];
  const templatesMap = /* @__PURE__ */ new Map();
  if (templateIds.length > 0) {
    const placeholders = templateIds.map(() => "?").join(", ");
    const templateRows = await executeQuery(
      `SELECT * FROM certificate_templates WHERE id IN (${placeholders})`,
      templateIds
    );
    for (const row of templateRows) {
      templatesMap.set(row.id, mapRowToCertificateTemplate(row));
    }
  }
  const courses = rows.map((row) => ({
    ...mapRowToCourse(row),
    disciplineCount: row.discipline_count,
    certificateTemplate: row.certificate_template_id ? templatesMap.get(row.certificate_template_id) : void 0
  }));
  return {
    data: courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getCourseById(id, includeDisciplines = true) {
  const rows = await executeQuery(
    "SELECT * FROM courses WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) return null;
  const course = mapRowToCourse(rows[0]);
  if (course.certificateTemplateId) {
    course.certificateTemplate = await getCertificateTemplateById(course.certificateTemplateId) || void 0;
  }
  if (includeDisciplines) {
    course.disciplines = await getDisciplinesByCourseId(id);
  }
  return course;
}
async function courseCodeExists(code, excludeId) {
  let query = "SELECT 1 FROM courses WHERE code = ?";
  const params = [code];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function createCourse(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  const totalHours = data.disciplines?.reduce((sum, d) => sum + d.theoryHours + d.practiceHours + d.assessmentHours, 0) || 0;
  await executeTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO courses (id, name, short_name, code, description, total_hours, certificate_template_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.shortName.toUpperCase(),
        data.code,
        data.description || null,
        totalHours,
        data.certificateTemplateId || null,
        data.isActive !== false,
        now,
        now
      ]
    );
    if (data.disciplines && data.disciplines.length > 0) {
      for (let i = 0; i < data.disciplines.length; i++) {
        const discipline = data.disciplines[i];
        const disciplineId = v4();
        await connection.execute(
          `INSERT INTO disciplines (id, course_id, name, description, theory_hours, practice_hours, assessment_hours, order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            disciplineId,
            id,
            discipline.name,
            discipline.description || null,
            discipline.theoryHours,
            discipline.practiceHours,
            discipline.assessmentHours,
            discipline.orderIndex ?? i,
            now,
            now
          ]
        );
        if (discipline.instructorIds && discipline.instructorIds.length > 0) {
          for (let j = 0; j < discipline.instructorIds.length; j++) {
            const diId = v4();
            await connection.execute(
              `INSERT INTO discipline_instructors (id, discipline_id, instructor_id, is_primary, created_at)
               VALUES (?, ?, ?, ?, ?)`,
              [diId, disciplineId, discipline.instructorIds[j], j === 0, now]
            );
          }
        }
      }
    }
  });
  const course = await getCourseById(id);
  if (!course) throw new Error("Failed to create course");
  return course;
}
async function updateCourse(id, data) {
  const existing = await getCourseById(id, false);
  if (!existing) return null;
  const updates = [];
  const params = [];
  if (data.name !== void 0) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.shortName !== void 0) {
    updates.push("short_name = ?");
    params.push(data.shortName.toUpperCase());
  }
  if (data.code !== void 0) {
    updates.push("code = ?");
    params.push(data.code);
  }
  if (data.description !== void 0) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.certificateTemplateId !== void 0) {
    updates.push("certificate_template_id = ?");
    params.push(data.certificateTemplateId);
  }
  if (data.isActive !== void 0) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }
  if (updates.length === 0) return existing;
  params.push(id);
  await executeQuery(
    `UPDATE courses SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getCourseById(id);
}
async function deleteCourse(id) {
  const result = await executeQuery(
    "DELETE FROM courses WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function addDisciplineToCourse(courseId, data) {
  const course = await getCourseById(courseId, false);
  if (!course) return null;
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeTransaction(async (connection) => {
    const [maxOrderRows] = await connection.execute(
      "SELECT COALESCE(MAX(order_index), -1) as max_order FROM disciplines WHERE course_id = ?",
      [courseId]
    );
    const nextOrder = (maxOrderRows[0]?.max_order ?? -1) + 1;
    await connection.execute(
      `INSERT INTO disciplines (id, course_id, name, description, theory_hours, practice_hours, assessment_hours, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, courseId, data.name, data.description || null, data.theoryHours, data.practiceHours, data.assessmentHours, data.orderIndex ?? nextOrder, now, now]
    );
    if (data.instructorIds && data.instructorIds.length > 0) {
      for (let i = 0; i < data.instructorIds.length; i++) {
        const diId = v4();
        await connection.execute(
          `INSERT INTO discipline_instructors (id, discipline_id, instructor_id, is_primary, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [diId, id, data.instructorIds[i], i === 0, now]
        );
      }
    }
    await connection.execute(
      `UPDATE courses SET total_hours = (SELECT COALESCE(SUM(hours), 0) FROM disciplines WHERE course_id = ?) WHERE id = ?`,
      [courseId, courseId]
    );
  });
  const disciplines = await getDisciplinesByCourseId(courseId);
  return disciplines.find((d) => d.id === id) || null;
}
async function updateDiscipline(disciplineId, data) {
  const rows = await executeQuery(
    "SELECT * FROM disciplines WHERE id = ? LIMIT 1",
    [disciplineId]
  );
  if (rows.length === 0) return null;
  const courseId = rows[0].course_id;
  await executeTransaction(async (connection) => {
    const updates = [];
    const params = [];
    if (data.name !== void 0) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.description !== void 0) {
      updates.push("description = ?");
      params.push(data.description);
    }
    if (data.theoryHours !== void 0) {
      updates.push("theory_hours = ?");
      params.push(data.theoryHours);
    }
    if (data.practiceHours !== void 0) {
      updates.push("practice_hours = ?");
      params.push(data.practiceHours);
    }
    if (data.assessmentHours !== void 0) {
      updates.push("assessment_hours = ?");
      params.push(data.assessmentHours);
    }
    if (data.orderIndex !== void 0) {
      updates.push("order_index = ?");
      params.push(data.orderIndex);
    }
    if (updates.length > 0) {
      params.push(disciplineId);
      await connection.execute(
        `UPDATE disciplines SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }
    if (data.instructorIds !== void 0) {
      await connection.execute(
        "DELETE FROM discipline_instructors WHERE discipline_id = ?",
        [disciplineId]
      );
      const now = /* @__PURE__ */ new Date();
      for (let i = 0; i < data.instructorIds.length; i++) {
        const diId = v4();
        await connection.execute(
          `INSERT INTO discipline_instructors (id, discipline_id, instructor_id, is_primary, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [diId, disciplineId, data.instructorIds[i], i === 0, now]
        );
      }
    }
    await connection.execute(
      `UPDATE courses SET total_hours = (SELECT COALESCE(SUM(hours), 0) FROM disciplines WHERE course_id = ?) WHERE id = ?`,
      [courseId, courseId]
    );
  });
  const disciplines = await getDisciplinesByCourseId(courseId);
  return disciplines.find((d) => d.id === disciplineId) || null;
}
async function deleteDiscipline(disciplineId) {
  const rows = await executeQuery(
    "SELECT course_id FROM disciplines WHERE id = ? LIMIT 1",
    [disciplineId]
  );
  if (rows.length === 0) return false;
  const courseId = rows[0].course_id;
  await executeTransaction(async (connection) => {
    await connection.execute("DELETE FROM disciplines WHERE id = ?", [disciplineId]);
    await connection.execute(
      `UPDATE courses SET total_hours = (SELECT COALESCE(SUM(hours), 0) FROM disciplines WHERE course_id = ?) WHERE id = ?`,
      [courseId, courseId]
    );
  });
  return true;
}

export { deleteDiscipline as a, updateDiscipline as b, courseCodeExists as c, deleteCourse as d, addDisciplineToCourse as e, getCoursesPaginated as f, getCourseById as g, createCourse as h, getAllCertificateTemplates as i, updateCourse as u };
//# sourceMappingURL=courseRepository.mjs.map
