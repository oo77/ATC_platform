import { e as executeQuery, p as executeTransaction } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';
import { g as getQuestionCountByLanguage, L as LANGUAGE_FLAGS, a as LANGUAGE_LABELS, b as getQuestionStatsByLanguage } from './questionRepository.mjs';

function parseJsonSafe(json, defaultValue) {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}
function mapRowToTestTemplate(row) {
  return {
    id: row.id,
    bank_id: row.bank_id,
    name: row.name,
    code: row.code,
    description: row.description,
    questions_mode: row.questions_mode,
    questions_count: row.questions_count,
    time_limit_minutes: row.time_limit_minutes,
    passing_score: row.passing_score,
    max_attempts: row.max_attempts,
    shuffle_questions: Boolean(row.shuffle_questions),
    shuffle_options: Boolean(row.shuffle_options),
    questions_per_page: row.questions_per_page,
    show_results: row.show_results,
    allow_back: Boolean(row.allow_back),
    proctoring_enabled: Boolean(row.proctoring_enabled),
    proctoring_settings: parseJsonSafe(row.proctoring_settings, null),
    allowed_languages: parseJsonSafe(row.allowed_languages, null),
    is_active: Boolean(row.is_active),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToTestTemplateWithDetails(row) {
  return {
    ...mapRowToTestTemplate(row),
    bank_name: row.bank_name || "",
    bank_code: row.bank_code || "",
    questions_total: row.questions_total || 0,
    created_by_name: row.created_by_name
  };
}
async function getTestTemplates(filters = {}, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const { bank_id, is_active, search } = filters;
  const conditions = [];
  const queryParams = [];
  if (bank_id) {
    conditions.push("tt.bank_id = ?");
    queryParams.push(bank_id);
  }
  if (is_active !== void 0) {
    conditions.push("tt.is_active = ?");
    queryParams.push(is_active);
  }
  if (search) {
    conditions.push("(tt.name LIKE ? OR tt.code LIKE ? OR tt.description LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM test_templates tt ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      tt.*,
      qb.name as bank_name,
      qb.code as bank_code,
      u.name as created_by_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_total
    FROM test_templates tt
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    LEFT JOIN users u ON tt.created_by = u.id
    ${whereClause}
    ORDER BY tt.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery(dataQuery, [...queryParams, limit, offset]);
  return {
    data: rows.map(mapRowToTestTemplateWithDetails),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getTestTemplateById(id) {
  const rows = await executeQuery(
    `SELECT 
      tt.*,
      qb.name as bank_name,
      qb.code as bank_code,
      u.name as created_by_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_total
    FROM test_templates tt
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    LEFT JOIN users u ON tt.created_by = u.id
    WHERE tt.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTestTemplateWithDetails(rows[0]);
}
async function testTemplateCodeExists(code, excludeId) {
  let query = "SELECT 1 FROM test_templates WHERE code = ?";
  const params = [code];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  query += " LIMIT 1";
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function createTestTemplate(data, userId) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO test_templates (
      id, bank_id, name, code, description, questions_mode, questions_count,
      time_limit_minutes, passing_score, max_attempts, shuffle_questions,
      shuffle_options, questions_per_page, show_results, allow_back,
      proctoring_enabled, proctoring_settings, allowed_languages, is_active, created_by,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.bank_id,
      data.name,
      data.code,
      data.description || null,
      data.questions_mode || "all",
      data.questions_count || null,
      data.time_limit_minutes || null,
      data.passing_score || 60,
      data.max_attempts || 1,
      data.shuffle_questions !== false,
      data.shuffle_options !== false,
      data.questions_per_page || 1,
      data.show_results || "immediately",
      data.allow_back !== false,
      data.proctoring_enabled || false,
      data.proctoring_settings ? JSON.stringify(data.proctoring_settings) : null,
      data.allowed_languages ? JSON.stringify(data.allowed_languages) : null,
      data.is_active !== false,
      userId || null,
      now,
      now
    ]
  );
  const template = await getTestTemplateById(id);
  if (!template) {
    throw new Error("Failed to create test template");
  }
  return template;
}
async function updateTestTemplate(id, data) {
  const existing = await getTestTemplateById(id);
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
  if (data.questions_mode !== void 0) {
    updates.push("questions_mode = ?");
    params.push(data.questions_mode);
  }
  if (data.questions_count !== void 0) {
    updates.push("questions_count = ?");
    params.push(data.questions_count);
  }
  if (data.time_limit_minutes !== void 0) {
    updates.push("time_limit_minutes = ?");
    params.push(data.time_limit_minutes);
  }
  if (data.passing_score !== void 0) {
    updates.push("passing_score = ?");
    params.push(data.passing_score);
  }
  if (data.max_attempts !== void 0) {
    updates.push("max_attempts = ?");
    params.push(data.max_attempts);
  }
  if (data.shuffle_questions !== void 0) {
    updates.push("shuffle_questions = ?");
    params.push(data.shuffle_questions);
  }
  if (data.shuffle_options !== void 0) {
    updates.push("shuffle_options = ?");
    params.push(data.shuffle_options);
  }
  if (data.questions_per_page !== void 0) {
    updates.push("questions_per_page = ?");
    params.push(data.questions_per_page);
  }
  if (data.show_results !== void 0) {
    updates.push("show_results = ?");
    params.push(data.show_results);
  }
  if (data.allow_back !== void 0) {
    updates.push("allow_back = ?");
    params.push(data.allow_back);
  }
  if (data.proctoring_enabled !== void 0) {
    updates.push("proctoring_enabled = ?");
    params.push(data.proctoring_enabled);
  }
  if (data.proctoring_settings !== void 0) {
    updates.push("proctoring_settings = ?");
    params.push(data.proctoring_settings ? JSON.stringify(data.proctoring_settings) : null);
  }
  if (data.is_active !== void 0) {
    updates.push("is_active = ?");
    params.push(data.is_active);
  }
  if (data.allowed_languages !== void 0) {
    updates.push("allowed_languages = ?");
    params.push(data.allowed_languages ? JSON.stringify(data.allowed_languages) : null);
  }
  if (updates.length === 0) {
    return existing;
  }
  updates.push("updated_at = ?");
  params.push(/* @__PURE__ */ new Date());
  params.push(id);
  await executeQuery(
    `UPDATE test_templates SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getTestTemplateById(id);
}
async function deleteTestTemplate(id) {
  const result = await executeQuery(
    "DELETE FROM test_templates WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function getTemplateQuestions(templateId) {
  const rows = await executeQuery(
    `SELECT * FROM test_template_questions 
     WHERE template_id = ?
     ORDER BY order_index ASC`,
    [templateId]
  );
  return rows.map((row) => ({
    id: row.id,
    template_id: row.template_id,
    question_id: row.question_id,
    order_index: row.order_index,
    points_override: row.points_override
  }));
}
async function setTemplateQuestions(templateId, questions) {
  await executeTransaction(async (connection) => {
    await connection.execute(
      "DELETE FROM test_template_questions WHERE template_id = ?",
      [templateId]
    );
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = v4();
      await connection.execute(
        `INSERT INTO test_template_questions (id, template_id, question_id, order_index, points_override)
         VALUES (?, ?, ?, ?, ?)`,
        [id, templateId, q.questionId, i, q.pointsOverride || null]
      );
    }
  });
}
async function getActiveTemplatesForSelect(bankId) {
  let query = `
    SELECT 
      tt.id, 
      tt.name, 
      tt.code,
      tt.time_limit_minutes,
      qb.name as bank_name,
      CASE 
        WHEN tt.questions_mode = 'all' THEN (SELECT COUNT(*) FROM questions q WHERE q.bank_id = tt.bank_id AND q.is_active = TRUE)
        WHEN tt.questions_mode = 'random' THEN tt.questions_count
        WHEN tt.questions_mode = 'manual' THEN (SELECT COUNT(*) FROM test_template_questions ttq WHERE ttq.template_id = tt.id)
        ELSE 0
      END as questions_count
    FROM test_templates tt
    LEFT JOIN question_banks qb ON tt.bank_id = qb.id
    WHERE tt.is_active = TRUE
  `;
  const params = [];
  if (bankId) {
    query += " AND tt.bank_id = ?";
    params.push(bankId);
  }
  query += " ORDER BY tt.name ASC";
  const rows = await executeQuery(query, params);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    bank_name: row.bank_name || "",
    questions_count: row.questions_count || 0,
    time_limit_minutes: row.time_limit_minutes
  }));
}
async function validateLanguagesQuestionCount(bankId, languages, minCount) {
  const validations = [];
  let allValid = true;
  for (const lang of languages) {
    const count = await getQuestionCountByLanguage(bankId, lang, true);
    const isValid = count >= minCount;
    if (!isValid) {
      allValid = false;
    }
    validations.push({
      language: lang,
      required: minCount,
      available: count,
      isValid,
      label: LANGUAGE_LABELS[lang],
      flag: LANGUAGE_FLAGS[lang]
    });
  }
  return { isValid: allValid, validations };
}
async function getAvailableLanguagesForTemplate(templateId) {
  const template = await getTestTemplateById(templateId);
  if (!template) {
    return [];
  }
  const languageStats = await getQuestionStatsByLanguage(template.bank_id, true);
  if (!template.allowed_languages || template.allowed_languages.length === 0) {
    const minQuestions2 = template.questions_mode === "random" && template.questions_count ? template.questions_count : 1;
    return languageStats.filter((stat) => stat.count >= minQuestions2).map((stat) => stat.language);
  }
  const minQuestions = template.questions_mode === "random" && template.questions_count ? template.questions_count : 1;
  const availableLanguages = [];
  for (const lang of template.allowed_languages) {
    const stat = languageStats.find((s) => s.language === lang);
    if (stat && stat.count >= minQuestions) {
      availableLanguages.push(lang);
    }
  }
  return availableLanguages;
}

export { getTemplateQuestions as a, getTestTemplates as b, createTestTemplate as c, deleteTestTemplate as d, getActiveTemplatesForSelect as e, getAvailableLanguagesForTemplate as f, getTestTemplateById as g, setTemplateQuestions as s, testTemplateCodeExists as t, updateTestTemplate as u, validateLanguagesQuestionCount as v };
//# sourceMappingURL=testTemplateRepository.mjs.map
