import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToQuestionBank(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    category: row.category,
    is_active: Boolean(row.is_active),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToQuestionBankWithStats(row) {
  return {
    ...mapRowToQuestionBank(row),
    questions_count: row.questions_count || 0,
    templates_count: row.templates_count || 0,
    created_by_name: row.created_by_name
  };
}
async function getQuestionBanks(filters = {}, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const { search, category, is_active } = filters;
  const conditions = [];
  const queryParams = [];
  if (search) {
    conditions.push("(qb.name LIKE ? OR qb.description LIKE ? OR qb.code LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  if (category) {
    conditions.push("qb.category = ?");
    queryParams.push(category);
  }
  if (is_active !== void 0) {
    conditions.push("qb.is_active = ?");
    queryParams.push(is_active);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM question_banks qb ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      qb.*,
      u.name as created_by_name,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id) as questions_count,
      (SELECT COUNT(*) FROM test_templates tt WHERE tt.bank_id = qb.id) as templates_count
    FROM question_banks qb
    LEFT JOIN users u ON qb.created_by = u.id
    ${whereClause}
    ORDER BY qb.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery(dataQuery, [...queryParams, limit, offset]);
  return {
    data: rows.map(mapRowToQuestionBankWithStats),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getQuestionBankById(id) {
  const rows = await executeQuery(
    `SELECT 
      qb.*,
      u.name as created_by_name,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id) as questions_count,
      (SELECT COUNT(*) FROM test_templates tt WHERE tt.bank_id = qb.id) as templates_count
    FROM question_banks qb
    LEFT JOIN users u ON qb.created_by = u.id
    WHERE qb.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToQuestionBankWithStats(rows[0]);
}
async function questionBankCodeExists(code, excludeId) {
  let query = "SELECT 1 FROM question_banks WHERE code = ?";
  const params = [code];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  query += " LIMIT 1";
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function createQuestionBank(data, userId) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO question_banks (id, name, code, description, category, is_active, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.code,
      data.description || null,
      data.category || null,
      data.is_active !== false,
      userId || null,
      now,
      now
    ]
  );
  const bank = await getQuestionBankById(id);
  if (!bank) {
    throw new Error("Failed to create question bank");
  }
  return bank;
}
async function updateQuestionBank(id, data) {
  const existing = await getQuestionBankById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.name !== void 0) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.code !== void 0) {
    updates.push("code = ?");
    params.push(data.code);
  }
  if (data.description !== void 0) {
    updates.push("description = ?");
    params.push(data.description || null);
  }
  if (data.category !== void 0) {
    updates.push("category = ?");
    params.push(data.category || null);
  }
  if (data.is_active !== void 0) {
    updates.push("is_active = ?");
    params.push(data.is_active);
  }
  if (updates.length === 0) {
    return existing;
  }
  updates.push("updated_at = ?");
  params.push(/* @__PURE__ */ new Date());
  params.push(id);
  await executeQuery(
    `UPDATE question_banks SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getQuestionBankById(id);
}
async function deleteQuestionBank(id) {
  const result = await executeQuery(
    "DELETE FROM question_banks WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function getQuestionBankCategories() {
  const rows = await executeQuery(
    `SELECT category, COUNT(*) as count 
     FROM question_banks 
     WHERE category IS NOT NULL AND category != ''
     GROUP BY category 
     ORDER BY count DESC, category ASC`
  );
  return rows.map((row) => ({
    category: row.category,
    count: row.count
  }));
}
async function getActiveBanksForSelect() {
  const rows = await executeQuery(
    `SELECT 
      qb.id, 
      qb.name, 
      qb.code,
      (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id AND q.is_active = TRUE) as questions_count
    FROM question_banks qb
    WHERE qb.is_active = TRUE
    ORDER BY qb.name ASC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    questions_count: row.questions_count || 0
  }));
}

export { getQuestionBankCategories as a, getQuestionBanks as b, createQuestionBank as c, deleteQuestionBank as d, getActiveBanksForSelect as e, getQuestionBankById as g, questionBankCodeExists as q, updateQuestionBank as u };
//# sourceMappingURL=questionBankRepository.mjs.map
