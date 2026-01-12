import { e as executeQuery, p as executeTransaction } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

var QuestionType = /* @__PURE__ */ ((QuestionType2) => {
  QuestionType2["SINGLE"] = "single";
  QuestionType2["MULTIPLE"] = "multiple";
  QuestionType2["TEXT"] = "text";
  QuestionType2["ORDER"] = "order";
  QuestionType2["MATCH"] = "match";
  return QuestionType2;
})(QuestionType || {});
var QuestionLanguage = /* @__PURE__ */ ((QuestionLanguage2) => {
  QuestionLanguage2["EN"] = "en";
  QuestionLanguage2["RU"] = "ru";
  QuestionLanguage2["UZ"] = "uz";
  return QuestionLanguage2;
})(QuestionLanguage || {});
const LANGUAGE_LABELS = {
  ["en" /* EN */]: "English",
  ["ru" /* RU */]: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
  ["uz" /* UZ */]: "O'zbek"
};
const LANGUAGE_FLAGS = {
  ["en" /* EN */]: "\u{1F1EC}\u{1F1E7}",
  ["ru" /* RU */]: "\u{1F1F7}\u{1F1FA}",
  ["uz" /* UZ */]: "\u{1F1FA}\u{1F1FF}"
};
var TestSessionStatus = /* @__PURE__ */ ((TestSessionStatus2) => {
  TestSessionStatus2["IN_PROGRESS"] = "in_progress";
  TestSessionStatus2["COMPLETED"] = "completed";
  TestSessionStatus2["TIMEOUT"] = "timeout";
  TestSessionStatus2["CANCELLED"] = "cancelled";
  TestSessionStatus2["VIOLATION"] = "violation";
  return TestSessionStatus2;
})(TestSessionStatus || {});

function parseJsonSafe(json, defaultValue) {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}
function mapRowToQuestion(row) {
  return {
    id: row.id,
    bank_id: row.bank_id,
    question_type: row.question_type,
    question_text: row.question_text,
    question_media: parseJsonSafe(row.question_media, null),
    options: parseJsonSafe(row.options, { options: [] }),
    points: row.points,
    explanation: row.explanation,
    difficulty: row.difficulty,
    language: row.language || QuestionLanguage.RU,
    tags: parseJsonSafe(row.tags, null),
    order_index: row.order_index,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToQuestionWithBank(row) {
  return {
    ...mapRowToQuestion(row),
    bank_name: row.bank_name || "",
    bank_code: row.bank_code || ""
  };
}
async function getQuestions(filters = {}, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const { bank_id, question_type, difficulty, language, languages, is_active, search, tags } = filters;
  const conditions = [];
  const queryParams = [];
  if (bank_id) {
    conditions.push("q.bank_id = ?");
    queryParams.push(bank_id);
  }
  if (question_type) {
    conditions.push("q.question_type = ?");
    queryParams.push(question_type);
  }
  if (difficulty) {
    conditions.push("q.difficulty = ?");
    queryParams.push(difficulty);
  }
  if (is_active !== void 0) {
    conditions.push("q.is_active = ?");
    queryParams.push(is_active);
  }
  if (search) {
    conditions.push("q.question_text LIKE ?");
    queryParams.push(`%${search}%`);
  }
  if (tags && tags.length > 0) {
    const tagConditions = tags.map(() => "JSON_CONTAINS(q.tags, ?)");
    conditions.push(`(${tagConditions.join(" OR ")})`);
    tags.forEach((tag) => queryParams.push(JSON.stringify(tag)));
  }
  if (language) {
    conditions.push("q.language = ?");
    queryParams.push(language);
  }
  if (languages && languages.length > 0) {
    const placeholders = languages.map(() => "?").join(", ");
    conditions.push(`q.language IN (${placeholders})`);
    queryParams.push(...languages);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM questions q ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      q.*,
      qb.name as bank_name,
      qb.code as bank_code
    FROM questions q
    LEFT JOIN question_banks qb ON q.bank_id = qb.id
    ${whereClause}
    ORDER BY q.order_index ASC, q.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery(dataQuery, [...queryParams, limit, offset]);
  return {
    data: rows.map(mapRowToQuestionWithBank),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getQuestionsByBankId(bankId, activeOnly = false) {
  let query = `
    SELECT * FROM questions 
    WHERE bank_id = ?
  `;
  const params = [bankId];
  if (activeOnly) {
    query += " AND is_active = TRUE";
  }
  query += " ORDER BY order_index ASC, created_at ASC";
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToQuestion);
}
async function getQuestionById(id) {
  const rows = await executeQuery(
    `SELECT 
      q.*,
      qb.name as bank_name,
      qb.code as bank_code
    FROM questions q
    LEFT JOIN question_banks qb ON q.bank_id = qb.id
    WHERE q.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToQuestionWithBank(rows[0]);
}
async function getRandomQuestionsFromBank(bankId, count, options = {}) {
  const { activeOnly = true, language } = options;
  let query = `
    SELECT * FROM questions 
    WHERE bank_id = ?
  `;
  const params = [bankId];
  if (activeOnly) {
    query += " AND is_active = TRUE";
  }
  if (language) {
    query += " AND language = ?";
    params.push(language);
  }
  query += " ORDER BY RAND() LIMIT ?";
  params.push(count);
  const rows = await executeQuery(query, params);
  return rows.map(mapRowToQuestion);
}
async function getQuestionsByIds(ids) {
  if (ids.length === 0) {
    return [];
  }
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await executeQuery(
    `SELECT * FROM questions WHERE id IN (${placeholders})`,
    ids
  );
  return rows.map(mapRowToQuestion);
}
async function createQuestion(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO questions (
      id, bank_id, question_type, question_text, question_media, options,
      points, explanation, difficulty, language, tags, order_index, is_active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.bank_id,
      data.question_type,
      data.question_text,
      data.question_media ? JSON.stringify(data.question_media) : null,
      JSON.stringify(data.options),
      data.points || 1,
      data.explanation || null,
      data.difficulty || "medium",
      data.language || QuestionLanguage.RU,
      data.tags ? JSON.stringify(data.tags) : null,
      data.order_index || 0,
      data.is_active !== false,
      now,
      now
    ]
  );
  const question = await getQuestionById(id);
  if (!question) {
    throw new Error("Failed to create question");
  }
  return question;
}
async function updateQuestion(id, data) {
  const existing = await getQuestionById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.question_type !== void 0) {
    updates.push("question_type = ?");
    params.push(data.question_type);
  }
  if (data.question_text !== void 0) {
    updates.push("question_text = ?");
    params.push(data.question_text);
  }
  if (data.question_media !== void 0) {
    updates.push("question_media = ?");
    params.push(data.question_media ? JSON.stringify(data.question_media) : null);
  }
  if (data.options !== void 0) {
    updates.push("options = ?");
    params.push(JSON.stringify(data.options));
  }
  if (data.points !== void 0) {
    updates.push("points = ?");
    params.push(data.points);
  }
  if (data.explanation !== void 0) {
    updates.push("explanation = ?");
    params.push(data.explanation || null);
  }
  if (data.difficulty !== void 0) {
    updates.push("difficulty = ?");
    params.push(data.difficulty);
  }
  if (data.tags !== void 0) {
    updates.push("tags = ?");
    params.push(data.tags ? JSON.stringify(data.tags) : null);
  }
  if (data.order_index !== void 0) {
    updates.push("order_index = ?");
    params.push(data.order_index);
  }
  if (data.is_active !== void 0) {
    updates.push("is_active = ?");
    params.push(data.is_active);
  }
  if (data.language !== void 0) {
    updates.push("language = ?");
    params.push(data.language);
  }
  if (updates.length === 0) {
    return existing;
  }
  updates.push("updated_at = ?");
  params.push(/* @__PURE__ */ new Date());
  params.push(id);
  await executeQuery(
    `UPDATE questions SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getQuestionById(id);
}
async function deleteQuestion(id) {
  const result = await executeQuery(
    "DELETE FROM questions WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function bulkCreateQuestions(questions) {
  const result = {
    created: 0,
    errors: []
  };
  if (questions.length === 0) {
    return result;
  }
  await executeTransaction(async (connection) => {
    for (let i = 0; i < questions.length; i++) {
      const data = questions[i];
      try {
        const id = v4();
        const now = /* @__PURE__ */ new Date();
        await connection.execute(
          `INSERT INTO questions (
            id, bank_id, question_type, question_text, question_media, options,
            points, explanation, difficulty, language, tags, order_index, is_active,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.bank_id,
            data.question_type,
            data.question_text,
            data.question_media ? JSON.stringify(data.question_media) : null,
            JSON.stringify(data.options),
            data.points || 1,
            data.explanation || null,
            data.difficulty || "medium",
            data.language || QuestionLanguage.RU,
            data.tags ? JSON.stringify(data.tags) : null,
            data.order_index || i,
            data.is_active !== false,
            now,
            now
          ]
        );
        result.created++;
      } catch (error) {
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });
  return result;
}
async function getNextOrderIndex(bankId) {
  const rows = await executeQuery(
    "SELECT MAX(order_index) as max_order FROM questions WHERE bank_id = ?",
    [bankId]
  );
  const maxOrder = rows[0]?.max_order;
  return (maxOrder || 0) + 1;
}
async function updateQuestionsOrder(orderedIds) {
  if (orderedIds.length === 0) {
    return;
  }
  await executeTransaction(async (connection) => {
    for (const item of orderedIds) {
      await connection.execute(
        "UPDATE questions SET order_index = ?, updated_at = ? WHERE id = ?",
        [item.order_index, /* @__PURE__ */ new Date(), item.id]
      );
    }
  });
}
async function getQuestionsCountByBankId(bankId, activeOnly = false) {
  let query = "SELECT COUNT(*) as total FROM questions WHERE bank_id = ?";
  const params = [bankId];
  if (activeOnly) {
    query += " AND is_active = TRUE";
  }
  const rows = await executeQuery(query, params);
  return rows[0]?.total || 0;
}
async function getQuestionCountByLanguage(bankId, language, activeOnly = true) {
  let query = "SELECT COUNT(*) as total FROM questions WHERE bank_id = ? AND language = ?";
  const params = [bankId, language];
  if (activeOnly) {
    query += " AND is_active = TRUE";
  }
  const rows = await executeQuery(query, params);
  return rows[0]?.total || 0;
}
async function getQuestionStatsByLanguage(bankId, activeOnly = true) {
  let query = `
    SELECT language, COUNT(*) as count 
    FROM questions 
    WHERE bank_id = ?
  `;
  const params = [bankId];
  if (activeOnly) {
    query += " AND is_active = TRUE";
  }
  query += " GROUP BY language ORDER BY count DESC";
  const rows = await executeQuery(query, params);
  return rows.map((row) => ({
    language: row.language,
    count: row.count,
    label: LANGUAGE_LABELS[row.language] || row.language,
    flag: LANGUAGE_FLAGS[row.language] || ""
  }));
}
async function getFullLanguageStats(bankId, activeOnly = true) {
  const stats = await getQuestionStatsByLanguage(bankId, activeOnly);
  const allLanguages = [QuestionLanguage.RU, QuestionLanguage.UZ, QuestionLanguage.EN];
  const existingLanguages = new Set(stats.map((s) => s.language));
  for (const lang of allLanguages) {
    if (!existingLanguages.has(lang)) {
      stats.push({
        language: lang,
        count: 0,
        label: LANGUAGE_LABELS[lang],
        flag: LANGUAGE_FLAGS[lang]
      });
    }
  }
  const order = { [QuestionLanguage.RU]: 0, [QuestionLanguage.UZ]: 1, [QuestionLanguage.EN]: 2 };
  stats.sort((a, b) => order[a.language] - order[b.language]);
  return stats;
}

export { LANGUAGE_FLAGS as L, QuestionType as Q, TestSessionStatus as T, LANGUAGE_LABELS as a, getQuestionStatsByLanguage as b, getQuestionById as c, deleteQuestion as d, bulkCreateQuestions as e, getQuestions as f, getQuestionCountByLanguage as g, getNextOrderIndex as h, createQuestion as i, updateQuestionsOrder as j, getFullLanguageStats as k, getQuestionsByIds as l, getQuestionsByBankId as m, getQuestionsCountByBankId as n, getRandomQuestionsFromBank as o, updateQuestion as u };
//# sourceMappingURL=questionRepository.mjs.map
