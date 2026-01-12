import { e as executeQuery } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function parseJsonSafe(json, defaultValue) {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}
function mapRowToTestSession(row) {
  return {
    id: row.id,
    assignment_id: row.assignment_id,
    student_id: row.student_id,
    preview_user_id: row.preview_user_id || null,
    attempt_number: row.attempt_number,
    status: row.status,
    is_preview: Boolean(row.is_preview),
    language: row.language || null,
    questions_order: parseJsonSafe(row.questions_order, null),
    current_question_index: row.current_question_index,
    started_at: row.started_at,
    completed_at: row.completed_at,
    time_spent_seconds: row.time_spent_seconds,
    total_points: row.total_points,
    max_points: row.max_points,
    score_percent: row.score_percent ? parseFloat(row.score_percent) : null,
    passed: row.passed !== null ? Boolean(row.passed) : null,
    grade: row.grade,
    violations: parseJsonSafe(row.violations, null),
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
function mapRowToTestSessionWithDetails(row) {
  return {
    ...mapRowToTestSession(row),
    student_name: row.student_name || "",
    student_iin: row.student_iin || "",
    template_name: row.template_name || "",
    answers_count: row.answers_count || 0
  };
}
function mapRowToTestAnswer(row) {
  return {
    id: row.id,
    session_id: row.session_id,
    question_id: row.question_id,
    answer_data: parseJsonSafe(row.answer_data, { selectedOption: "" }),
    is_correct: row.is_correct !== null ? Boolean(row.is_correct) : null,
    points_earned: row.points_earned,
    answered_at: row.answered_at,
    time_spent_seconds: row.time_spent_seconds
  };
}
async function getTestSessionById(id) {
  const rows = await executeQuery(
    `SELECT 
      ts.*,
      s.full_name as student_name,
      s.pinfl as student_iin,
      tt.name as template_name,
      (SELECT COUNT(*) FROM test_answers ta WHERE ta.session_id = ts.id) as answers_count
    FROM test_sessions ts
    LEFT JOIN students s ON ts.student_id = s.id
    LEFT JOIN test_assignments tass ON ts.assignment_id = tass.id
    LEFT JOIN test_templates tt ON tass.test_template_id = tt.id
    WHERE ts.id = ?
    LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTestSessionWithDetails(rows[0]);
}
async function getActiveSessionForStudent(assignmentId, studentId) {
  const rows = await executeQuery(
    `SELECT * FROM test_sessions 
     WHERE assignment_id = ? AND student_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC
     LIMIT 1`,
    [assignmentId, studentId]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTestSession(rows[0]);
}
async function getStudentAttemptCount(assignmentId, studentId) {
  const rows = await executeQuery(
    "SELECT COUNT(*) as total FROM test_sessions WHERE assignment_id = ? AND student_id = ?",
    [assignmentId, studentId]
  );
  return rows[0]?.total || 0;
}
async function createTestSession(data, questionsOrder) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  let attemptNumber = 1;
  if (!data.is_preview && data.assignment_id && data.student_id) {
    const attemptCount = await getStudentAttemptCount(data.assignment_id, data.student_id);
    attemptNumber = attemptCount + 1;
  }
  await executeQuery(
    `INSERT INTO test_sessions (
      id, assignment_id, student_id, attempt_number, status, is_preview, preview_user_id,
      language, questions_order, current_question_index, started_at,
      ip_address, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.assignment_id || null,
      data.student_id || null,
      attemptNumber,
      "in_progress",
      data.is_preview || false,
      data.preview_user_id || null,
      data.language || null,
      JSON.stringify(questionsOrder),
      0,
      now,
      data.ip_address || null,
      data.user_agent || null,
      now,
      now
    ]
  );
  const session = await getTestSessionById(id);
  if (!session) {
    throw new Error("Failed to create test session");
  }
  return session;
}
async function updateCurrentQuestionIndex(sessionId, index) {
  await executeQuery(
    "UPDATE test_sessions SET current_question_index = ?, updated_at = ? WHERE id = ?",
    [index, /* @__PURE__ */ new Date(), sessionId]
  );
}
async function addViolation(sessionId, violation) {
  const rows = await executeQuery(
    "SELECT violations FROM test_sessions WHERE id = ?",
    [sessionId]
  );
  if (rows.length === 0) {
    return;
  }
  const violations = parseJsonSafe(rows[0].violations, []);
  violations.push(violation);
  await executeQuery(
    "UPDATE test_sessions SET violations = ?, updated_at = ? WHERE id = ?",
    [JSON.stringify(violations), /* @__PURE__ */ new Date(), sessionId]
  );
}
async function updateSessionStatus(sessionId, status) {
  const updates = ["status = ?", "updated_at = ?"];
  const params = [status, /* @__PURE__ */ new Date()];
  if (status === "completed" || status === "timeout" || status === "violation") {
    updates.push("completed_at = ?");
    params.push(/* @__PURE__ */ new Date());
  }
  params.push(sessionId);
  await executeQuery(
    `UPDATE test_sessions SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
}
async function finishSession(sessionId, results) {
  await executeQuery(
    `UPDATE test_sessions SET 
      status = 'completed',
      completed_at = ?,
      total_points = ?,
      max_points = ?,
      score_percent = ?,
      passed = ?,
      grade = ?,
      time_spent_seconds = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      /* @__PURE__ */ new Date(),
      results.total_points,
      results.max_points,
      results.score_percent,
      results.passed,
      results.grade,
      results.time_spent_seconds,
      /* @__PURE__ */ new Date(),
      sessionId
    ]
  );
}
async function getSessionAnswers(sessionId) {
  const rows = await executeQuery(
    "SELECT * FROM test_answers WHERE session_id = ? ORDER BY answered_at ASC",
    [sessionId]
  );
  return rows.map(mapRowToTestAnswer);
}
async function getAnswerForQuestion(sessionId, questionId) {
  const rows = await executeQuery(
    "SELECT * FROM test_answers WHERE session_id = ? AND question_id = ? LIMIT 1",
    [sessionId, questionId]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRowToTestAnswer(rows[0]);
}
async function saveAnswer(data, question) {
  const now = /* @__PURE__ */ new Date();
  const { isCorrect, pointsEarned } = validateAnswer(question, data.answer_data);
  const existing = await getAnswerForQuestion(data.session_id, data.question_id);
  if (existing) {
    await executeQuery(
      `UPDATE test_answers SET 
        answer_data = ?,
        is_correct = ?,
        points_earned = ?,
        answered_at = ?,
        time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?
      WHERE id = ?`,
      [
        JSON.stringify(data.answer_data),
        isCorrect,
        pointsEarned,
        now,
        data.time_spent_seconds || 0,
        existing.id
      ]
    );
    return {
      ...existing,
      answer_data: data.answer_data,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      answered_at: now
    };
  } else {
    const id = v4();
    await executeQuery(
      `INSERT INTO test_answers (
        id, session_id, question_id, answer_data,
        is_correct, points_earned, answered_at, time_spent_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.session_id,
        data.question_id,
        JSON.stringify(data.answer_data),
        isCorrect,
        pointsEarned,
        now,
        data.time_spent_seconds || null
      ]
    );
    return {
      id,
      session_id: data.session_id,
      question_id: data.question_id,
      answer_data: data.answer_data,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      answered_at: now,
      time_spent_seconds: data.time_spent_seconds || null
    };
  }
}
function validateAnswer(question, answerData) {
  switch (question.question_type) {
    case "single":
      return validateSingleChoice(question, answerData);
    // TODO: Добавить остальные типы вопросов
    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}
function validateSingleChoice(question, answerData) {
  const options = question.options;
  const answer = answerData;
  if (!answer.selectedOption || !options.options) {
    return { isCorrect: false, pointsEarned: 0 };
  }
  const correctOption = options.options.find((o) => o.correct);
  const isCorrect = answer.selectedOption === correctOption?.id;
  return {
    isCorrect,
    pointsEarned: isCorrect ? question.points : 0
  };
}
async function calculateSessionResults(sessionId) {
  const session = await getTestSessionById(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }
  const answers = await getSessionAnswers(sessionId);
  const assignmentRows = await executeQuery(
    `SELECT 
      ta.passing_score_override,
      tt.passing_score
    FROM test_assignments ta
    LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
    WHERE ta.id = ?`,
    [session.assignment_id]
  );
  const passingScore = assignmentRows[0]?.passing_score_override || assignmentRows[0]?.passing_score || 60;
  let totalPoints = 0;
  let maxPoints = 0;
  let correctCount = 0;
  for (const answer of answers) {
    if (answer.is_correct) {
      totalPoints += answer.points_earned;
      correctCount++;
    }
  }
  const questionsOrder = session.questions_order || [];
  const questionIds = questionsOrder.map((q) => q.questionId);
  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => "?").join(", ");
    const questionRows = await executeQuery(
      `SELECT SUM(points) as total_points FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );
    maxPoints = questionRows[0]?.total_points || 0;
  }
  const scorePercent = maxPoints > 0 ? totalPoints / maxPoints * 100 : 0;
  const passed = scorePercent >= passingScore;
  const grade = Math.round(scorePercent);
  const timeSpentSeconds = session.started_at ? Math.floor(((/* @__PURE__ */ new Date()).getTime() - new Date(session.started_at).getTime()) / 1e3) : 0;
  return {
    session_id: sessionId,
    total_points: totalPoints,
    max_points: maxPoints,
    score_percent: scorePercent,
    passed,
    grade,
    answers_count: answers.length,
    correct_count: correctCount,
    time_spent_seconds: timeSpentSeconds
  };
}
async function getAssignmentResults(assignmentId) {
  const rows = await executeQuery(
    `SELECT 
      ts.student_id,
      s.full_name as student_name,
      s.pinfl as student_iin,
      COUNT(*) as attempts,
      MAX(ts.score_percent) as best_score,
      MAX(ts.started_at) as last_attempt_at,
      MAX(ts.passed) as passed
    FROM test_sessions ts
    LEFT JOIN students s ON ts.student_id = s.id
    WHERE ts.assignment_id = ?
    GROUP BY ts.student_id, s.full_name, s.pinfl
    ORDER BY s.full_name ASC`,
    [assignmentId]
  );
  return rows.map((row) => ({
    student_id: row.student_id,
    student_name: row.student_name || "",
    student_iin: row.student_iin || "",
    attempts: row.attempts,
    best_score: row.best_score ? parseFloat(row.best_score) : null,
    last_attempt_at: row.last_attempt_at,
    passed: Boolean(row.passed)
  }));
}

export { getTestSessionById as a, getSessionAnswers as b, createTestSession as c, calculateSessionResults as d, addViolation as e, finishSession as f, getAssignmentResults as g, updateSessionStatus as h, getActiveSessionForStudent as i, getStudentAttemptCount as j, saveAnswer as s, updateCurrentQuestionIndex as u };
//# sourceMappingURL=testSessionRepository.mjs.map
