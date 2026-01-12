import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToDisciplineTest(row) {
  return {
    id: row.id,
    discipline_id: row.discipline_id,
    test_template_id: row.test_template_id,
    is_required: Boolean(row.is_required),
    order_index: row.order_index,
    notes: row.notes,
    created_at: row.created_at
  };
}
function mapRowToDisciplineTestWithDetails(row) {
  return {
    ...mapRowToDisciplineTest(row),
    template_name: row.template_name || "",
    template_code: row.template_code || "",
    bank_name: row.bank_name || "",
    questions_count: row.questions_count || 0,
    time_limit_minutes: row.time_limit_minutes || null,
    passing_score: row.passing_score || 60
  };
}
async function getDisciplineTests(disciplineId) {
  const rows = await executeQuery(
    `SELECT 
      dt.*,
      tt.name as template_name,
      tt.code as template_code,
      tt.time_limit_minutes,
      tt.passing_score,
      qb.name as bank_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_count
    FROM discipline_tests dt
    LEFT JOIN test_templates tt ON dt.test_template_id = tt.id
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    WHERE dt.discipline_id = ?
    ORDER BY dt.order_index ASC, dt.created_at ASC`,
    [disciplineId]
  );
  return rows.map(mapRowToDisciplineTestWithDetails);
}
async function getDisciplineTestById(id) {
  const rows = await executeQuery(
    `SELECT 
      dt.*,
      tt.name as template_name,
      tt.code as template_code,
      tt.time_limit_minutes,
      tt.passing_score,
      qb.name as bank_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_count
    FROM discipline_tests dt
    LEFT JOIN test_templates tt ON dt.test_template_id = tt.id
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    WHERE dt.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToDisciplineTestWithDetails(rows[0]);
}
async function disciplineTestExists(disciplineId, testTemplateId) {
  const rows = await executeQuery(
    "SELECT 1 FROM discipline_tests WHERE discipline_id = ? AND test_template_id = ? LIMIT 1",
    [disciplineId, testTemplateId]
  );
  return rows.length > 0;
}
async function createDisciplineTest(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  let orderIndex = data.order_index;
  if (orderIndex === void 0) {
    const rows = await executeQuery(
      "SELECT MAX(order_index) as max_order FROM discipline_tests WHERE discipline_id = ?",
      [data.discipline_id]
    );
    orderIndex = (rows[0]?.max_order || 0) + 1;
  }
  await executeQuery(
    `INSERT INTO discipline_tests (id, discipline_id, test_template_id, is_required, order_index, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.discipline_id,
      data.test_template_id,
      data.is_required || false,
      orderIndex,
      data.notes || null,
      now
    ]
  );
  const result = await getDisciplineTestById(id);
  if (!result) {
    throw new Error("Failed to create discipline test");
  }
  return result;
}
async function updateDisciplineTest(id, data) {
  const existing = await getDisciplineTestById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.is_required !== void 0) {
    updates.push("is_required = ?");
    params.push(data.is_required);
  }
  if (data.order_index !== void 0) {
    updates.push("order_index = ?");
    params.push(data.order_index);
  }
  if (data.notes !== void 0) {
    updates.push("notes = ?");
    params.push(data.notes || null);
  }
  if (updates.length === 0) {
    return existing;
  }
  params.push(id);
  await executeQuery(
    `UPDATE discipline_tests SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getDisciplineTestById(id);
}
async function deleteDisciplineTest(id) {
  const result = await executeQuery(
    "DELETE FROM discipline_tests WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function getDisciplinesByTestTemplateId(testTemplateId) {
  const rows = await executeQuery(
    `SELECT 
      dt.discipline_id,
      d.name as discipline_name,
      c.name as course_name,
      dt.is_required
    FROM discipline_tests dt
    LEFT JOIN disciplines d ON dt.discipline_id = d.id
    LEFT JOIN courses c ON d.course_id = c.id
    WHERE dt.test_template_id = ?
    ORDER BY c.name ASC, d.name ASC`,
    [testTemplateId]
  );
  return rows.map((row) => ({
    discipline_id: row.discipline_id,
    discipline_name: row.discipline_name || "",
    course_name: row.course_name || "",
    is_required: Boolean(row.is_required)
  }));
}

export { getDisciplineTests as a, disciplineTestExists as b, createDisciplineTest as c, deleteDisciplineTest as d, getDisciplinesByTestTemplateId as e, getDisciplineTestById as g, updateDisciplineTest as u };
//# sourceMappingURL=disciplineTestRepository.mjs.map
