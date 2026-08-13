/**
 * Репозиторий для сессий прохождения аттестационного теста инструкторами
 * (аналог testSessionRepository.ts, адаптирован под attestation_test_sessions/answers)
 */

import { executeQuery } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type {
  Question,
  AnswerData,
  SingleChoiceOptions,
  SessionQuestionOrder,
  ViolationRecord,
} from "../types/testing";

export type AttestationSessionStatus =
  | "in_progress"
  | "completed"
  | "timeout"
  | "cancelled"
  | "violation";

export interface AttestationTestSession {
  id: string;
  groupId: string;
  instructorId: string;
  attemptNumber: number;
  status: AttestationSessionStatus;
  questionsOrder: SessionQuestionOrder[] | null;
  currentQuestionIndex: number;
  startedAt: Date;
  completedAt: Date | null;
  timeSpentSeconds: number | null;
  totalPoints: number | null;
  maxPoints: number | null;
  scorePercent: number | null;
  passed: boolean | null;
  grade: number | null;
  violations: ViolationRecord[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttestationTestAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  answerData: AnswerData;
  isCorrect: boolean | null;
  pointsEarned: number;
  answeredAt: Date;
  timeSpentSeconds: number | null;
}

interface SessionRow extends RowDataPacket {
  id: string;
  group_id: string;
  instructor_id: string;
  attempt_number: number;
  status: AttestationSessionStatus;
  questions_order: string | null;
  current_question_index: number;
  started_at: Date;
  completed_at: Date | null;
  time_spent_seconds: number | null;
  total_points: number | null;
  max_points: number | null;
  score_percent: string | null;
  passed: number | boolean | null;
  grade: number | null;
  violations: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AnswerRow extends RowDataPacket {
  id: string;
  session_id: string;
  question_id: string;
  answer_data: string;
  is_correct: number | boolean | null;
  points_earned: number;
  answered_at: Date;
  time_spent_seconds: number | null;
}

function parseJsonSafe<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function mapSession(row: SessionRow): AttestationTestSession {
  return {
    id: row.id,
    groupId: row.group_id,
    instructorId: row.instructor_id,
    attemptNumber: row.attempt_number,
    status: row.status,
    questionsOrder: parseJsonSafe<SessionQuestionOrder[] | null>(row.questions_order, null),
    currentQuestionIndex: row.current_question_index,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    timeSpentSeconds: row.time_spent_seconds,
    totalPoints: row.total_points,
    maxPoints: row.max_points,
    scorePercent: row.score_percent ? parseFloat(row.score_percent) : null,
    passed: row.passed !== null ? Boolean(row.passed) : null,
    grade: row.grade,
    violations: parseJsonSafe<ViolationRecord[] | null>(row.violations, null),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAnswer(row: AnswerRow): AttestationTestAnswer {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    answerData: parseJsonSafe<AnswerData>(row.answer_data, { selectedOption: "" } as AnswerData),
    isCorrect: row.is_correct !== null ? Boolean(row.is_correct) : null,
    pointsEarned: row.points_earned,
    answeredAt: row.answered_at,
    timeSpentSeconds: row.time_spent_seconds,
  };
}

export async function getSessionById(id: string): Promise<AttestationTestSession | null> {
  const rows = await executeQuery<SessionRow[]>(
    "SELECT * FROM attestation_test_sessions WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length ? mapSession(rows[0]) : null;
}

export async function getActiveSessionForInstructor(
  groupId: string,
  instructorId: string
): Promise<AttestationTestSession | null> {
  const rows = await executeQuery<SessionRow[]>(
    `SELECT * FROM attestation_test_sessions
     WHERE group_id = ? AND instructor_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [groupId, instructorId]
  );
  return rows.length ? mapSession(rows[0]) : null;
}

export async function getBestSessionForInstructor(
  groupId: string,
  instructorId: string
): Promise<AttestationTestSession | null> {
  const rows = await executeQuery<SessionRow[]>(
    `SELECT * FROM attestation_test_sessions
     WHERE group_id = ? AND instructor_id = ? AND status = 'completed'
     ORDER BY score_percent DESC, started_at DESC LIMIT 1`,
    [groupId, instructorId]
  );
  return rows.length ? mapSession(rows[0]) : null;
}

export async function getInstructorAttemptCount(
  groupId: string,
  instructorId: string
): Promise<number> {
  const rows = await executeQuery<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM attestation_test_sessions WHERE group_id = ? AND instructor_id = ?",
    [groupId, instructorId]
  );
  return rows[0]?.total || 0;
}

export async function createSession(
  data: {
    groupId: string;
    instructorId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
  questionsOrder: SessionQuestionOrder[]
): Promise<AttestationTestSession> {
  const id = uuidv4();
  const now = new Date();
  const attemptNumber = (await getInstructorAttemptCount(data.groupId, data.instructorId)) + 1;

  await executeQuery(
    `INSERT INTO attestation_test_sessions (
      id, group_id, instructor_id, attempt_number, status,
      questions_order, current_question_index, started_at,
      ip_address, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'in_progress', ?, 0, ?, ?, ?, ?, ?)`,
    [
      id,
      data.groupId,
      data.instructorId,
      attemptNumber,
      JSON.stringify(questionsOrder),
      now,
      data.ipAddress || null,
      data.userAgent || null,
      now,
      now,
    ]
  );

  const session = await getSessionById(id);
  if (!session) throw new Error("Failed to create attestation session");
  return session;
}

export async function updateCurrentQuestionIndex(sessionId: string, index: number): Promise<void> {
  await executeQuery(
    "UPDATE attestation_test_sessions SET current_question_index = ?, updated_at = ? WHERE id = ?",
    [index, new Date(), sessionId]
  );
}

export async function finishSession(
  sessionId: string,
  results: {
    totalPoints: number;
    maxPoints: number;
    scorePercent: number;
    passed: boolean;
    grade: number;
    timeSpentSeconds: number;
  }
): Promise<void> {
  await executeQuery(
    `UPDATE attestation_test_sessions SET
      status = 'completed', completed_at = ?, total_points = ?, max_points = ?,
      score_percent = ?, passed = ?, grade = ?, time_spent_seconds = ?, updated_at = ?
     WHERE id = ?`,
    [
      new Date(),
      results.totalPoints,
      results.maxPoints,
      results.scorePercent,
      results.passed,
      results.grade,
      results.timeSpentSeconds,
      new Date(),
      sessionId,
    ]
  );
}

// ============================================================================
// ОТВЕТЫ
// ============================================================================

export async function getSessionAnswers(sessionId: string): Promise<AttestationTestAnswer[]> {
  const rows = await executeQuery<AnswerRow[]>(
    "SELECT * FROM attestation_test_answers WHERE session_id = ? ORDER BY answered_at ASC",
    [sessionId]
  );
  return rows.map(mapAnswer);
}

export async function getAnswerForQuestion(
  sessionId: string,
  questionId: string
): Promise<AttestationTestAnswer | null> {
  const rows = await executeQuery<AnswerRow[]>(
    "SELECT * FROM attestation_test_answers WHERE session_id = ? AND question_id = ? LIMIT 1",
    [sessionId, questionId]
  );
  return rows.length ? mapAnswer(rows[0]) : null;
}

function validateAnswer(
  question: Question,
  answerData: AnswerData
): { isCorrect: boolean; pointsEarned: number } {
  switch (question.question_type) {
    case "single": {
      const options = question.options as SingleChoiceOptions;
      const answer = answerData as { selectedOption?: string };
      if (!answer.selectedOption || !options.options) {
        return { isCorrect: false, pointsEarned: 0 };
      }
      const correctOption = options.options.find((o) => o.correct);
      const isCorrect = answer.selectedOption === correctOption?.id;
      return { isCorrect, pointsEarned: isCorrect ? question.points : 0 };
    }
    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}

export async function saveAnswer(
  data: {
    sessionId: string;
    questionId: string;
    answerData: AnswerData;
    timeSpentSeconds?: number;
  },
  question: Question
): Promise<AttestationTestAnswer> {
  const now = new Date();
  const { isCorrect, pointsEarned } = validateAnswer(question, data.answerData);
  const existing = await getAnswerForQuestion(data.sessionId, data.questionId);

  if (existing) {
    await executeQuery(
      `UPDATE attestation_test_answers SET
        answer_data = ?, is_correct = ?, points_earned = ?, answered_at = ?,
        time_spent_seconds = COALESCE(time_spent_seconds, 0) + ?
       WHERE id = ?`,
      [
        JSON.stringify(data.answerData),
        isCorrect,
        pointsEarned,
        now,
        data.timeSpentSeconds || 0,
        existing.id,
      ]
    );
    return { ...existing, answerData: data.answerData, isCorrect, pointsEarned, answeredAt: now };
  }

  const id = uuidv4();
  await executeQuery(
    `INSERT INTO attestation_test_answers (
      id, session_id, question_id, answer_data, is_correct, points_earned, answered_at, time_spent_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.sessionId,
      data.questionId,
      JSON.stringify(data.answerData),
      isCorrect,
      pointsEarned,
      now,
      data.timeSpentSeconds || null,
    ]
  );

  return {
    id,
    sessionId: data.sessionId,
    questionId: data.questionId,
    answerData: data.answerData,
    isCorrect,
    pointsEarned,
    answeredAt: now,
    timeSpentSeconds: data.timeSpentSeconds || null,
  };
}

export async function calculateSessionResults(sessionId: string, passingScore: number) {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error("Session not found");

  const answers = await getSessionAnswers(sessionId);

  let totalPoints = 0;
  let correctCount = 0;
  for (const answer of answers) {
    if (answer.isCorrect) {
      totalPoints += answer.pointsEarned;
      correctCount++;
    }
  }

  const questionIds = (session.questionsOrder || []).map((q) => q.questionId);
  let maxPoints = 0;
  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => "?").join(", ");
    const rows = await executeQuery<RowDataPacket[]>(
      `SELECT SUM(points) as total_points FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );
    maxPoints = rows[0]?.total_points || 0;
  }

  const scorePercent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
  const passed = scorePercent >= passingScore;
  const grade = Math.round(scorePercent);
  const timeSpentSeconds = session.startedAt
    ? Math.floor((new Date().getTime() - new Date(session.startedAt).getTime()) / 1000)
    : 0;

  return {
    sessionId,
    totalPoints,
    maxPoints,
    scorePercent,
    passed,
    grade,
    answersCount: answers.length,
    correctCount,
    timeSpentSeconds,
  };
}

export async function getGroupSessions(groupId: string): Promise<AttestationTestSession[]> {
  const rows = await executeQuery<SessionRow[]>(
    "SELECT * FROM attestation_test_sessions WHERE group_id = ? ORDER BY started_at DESC",
    [groupId]
  );
  return rows.map(mapSession);
}
