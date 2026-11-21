/**
 * Завершение тестовых сессий (обычные тесты слушателей и аттестация инструкторов).
 *
 * Используется и кнопкой «Завершить», и сервером, когда время вышло:
 * раньше тест по истечении лимита завершала только страница в браузере, и если
 * вкладку закрыли, сессия навсегда оставалась «в процессе».
 */

import {
  getTestSessionById,
  finishSession as finishTestSession,
  calculateSessionResults as calculateTestResults,
} from "../repositories/testSessionRepository";
import { getTestAssignmentById } from "../repositories/testAssignmentRepository";
import {
  getSessionById as getAttestationSessionById,
  finishSession as finishAttestationSession,
  calculateSessionResults as calculateAttestationResults,
} from "../repositories/attestationSessionRepository";
import { getAttestationGroupById } from "../repositories/attestationGroupRepository";
import { getTestTemplateById } from "../repositories/testTemplateRepository";
import { upsertResultScore } from "../repositories/attestationResultRepository";
import { executeQuery } from "./db";
import { v4 as uuidv4 } from "uuid";
import { notifyTestingRoomAdmins } from "./testingRoomHub";

/** Сколько секунд после окончания лимита ещё принимаем ответы (сетевые задержки) */
export const EXAM_GRACE_SECONDS = 60;

export interface ExamResults {
  total_points: number;
  max_points: number;
  score_percent: number;
  passed: boolean;
  grade: number;
  answers_count?: number;
  correct_count?: number;
  time_spent_seconds?: number;
}

export interface CompletionOutcome {
  /** true — сессию завершил именно этот вызов; false — она уже была завершена */
  completedNow: boolean;
  results: ExamResults;
}

/** true, если лимит времени (плюс запас) истёк */
export function isExamTimeOver(startedAt: Date | string | null | undefined, limitMinutes: number | null | undefined): boolean {
  if (!startedAt || !limitMinutes) return false;
  const deadline = new Date(startedAt).getTime() + (limitMinutes * 60 + EXAM_GRACE_SECONDS) * 1000;
  return Date.now() > deadline;
}

/** Лимит времени обычного теста (минуты) с учётом переопределения в назначении */
export async function getTestSessionTimeLimit(assignmentId: string | null | undefined): Promise<number | null> {
  if (!assignmentId) return null;
  const rows = await executeQuery<any[]>(
    `SELECT COALESCE(ta.time_limit_override, tt.time_limit_minutes) AS lim
       FROM test_assignments ta
       JOIN test_templates tt ON tt.id = ta.test_template_id
      WHERE ta.id = ?`,
    [assignmentId],
  );
  return rows[0]?.lim || null;
}

/** Лимит времени аттестационного теста (минуты) */
export async function getAttestationTimeLimit(groupId: string): Promise<number | null> {
  const rows = await executeQuery<any[]>(
    `SELECT tt.time_limit_minutes AS lim
       FROM attestation_groups ag
       JOIN test_templates tt ON tt.id = ag.test_template_id
      WHERE ag.id = ?`,
    [groupId],
  );
  return rows[0]?.lim || null;
}

/** Время прохождения не больше лимита: при автозавершении задачей оно иначе росло бы */
function capTimeSpent(seconds: number, limitMinutes: number | null | undefined): number {
  return limitMinutes ? Math.min(seconds, limitMinutes * 60) : seconds;
}

/**
 * Завершить обычный тест слушателя: подсчёт результатов, запись оценки в журнал.
 * Возвращает null, если сессии нет или она в статусе, который нельзя завершить.
 */
export async function completeTestSession(sessionId: string): Promise<CompletionOutcome | null> {
  const session = await getTestSessionById(sessionId);
  if (!session) return null;

  const stored = (s: typeof session): CompletionOutcome => ({
    completedNow: false,
    results: {
      total_points: s.total_points,
      max_points: s.max_points,
      score_percent: s.score_percent,
      passed: s.passed,
      grade: s.grade,
    } as ExamResults,
  });

  if (session.status === "completed") return stored(session);
  if (session.status !== "in_progress") return null;

  const results = await calculateTestResults(sessionId);
  const limit = await getTestSessionTimeLimit(session.assignment_id);
  const timeSpent = capTimeSpent(results.time_spent_seconds, limit);

  const won = await finishTestSession(sessionId, {
    total_points: results.total_points,
    max_points: results.max_points,
    score_percent: results.score_percent,
    passed: results.passed,
    grade: results.grade,
    time_spent_seconds: timeSpent,
  });

  if (!won) {
    // Параллельно завершили в другом запросе — отдаём сохранённое
    const fresh = await getTestSessionById(sessionId);
    return fresh ? stored(fresh) : null;
  }

  // Оценка в журнал — только для обычных сессий (preview не влияет на оценки)
  if (!session.is_preview && session.assignment_id) {
    try {
      const assignment = await getTestAssignmentById(session.assignment_id);
      if (assignment) {
        const now = new Date();
        await executeQuery(
          `INSERT INTO grades (id, student_id, schedule_event_id, grade, is_from_test, test_session_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, TRUE, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             grade = IF(is_modified = FALSE AND VALUES(grade) > grade, VALUES(grade), grade),
             is_from_test = TRUE,
             test_session_id = IF(is_modified = FALSE AND VALUES(grade) > grade, VALUES(test_session_id), test_session_id),
             updated_at = VALUES(updated_at)`,
          [uuidv4(), session.student_id, assignment.schedule_event_id, results.grade, sessionId, now, now],
        );
      }
    } catch (gradeError) {
      console.error("Ошибка записи оценки в журнал:", gradeError);
      // Не прерываем: тест всё равно завершён
    }
  }

  // Экран «Проведение тестирования» обновит результат слушателя
  notifyTestingRoomAdmins();

  return {
    completedNow: true,
    results: {
      total_points: results.total_points,
      max_points: results.max_points,
      score_percent: results.score_percent,
      passed: results.passed,
      grade: results.grade,
      answers_count: results.answers_count,
      correct_count: results.correct_count,
      time_spent_seconds: timeSpent,
    },
  };
}

/** Завершить аттестационный тест инструктора и обновить его результат в группе */
export async function completeAttestationSession(sessionId: string): Promise<CompletionOutcome | null> {
  const session = await getAttestationSessionById(sessionId);
  if (!session) return null;

  const stored = (s: typeof session): CompletionOutcome => ({
    completedNow: false,
    results: {
      total_points: s.totalPoints,
      max_points: s.maxPoints,
      score_percent: s.scorePercent,
      passed: s.passed,
      grade: s.grade,
    } as ExamResults,
  });

  if (session.status === "completed") return stored(session);
  if (session.status !== "in_progress") return null;

  const group = await getAttestationGroupById(session.groupId);
  const template = group?.testTemplateId ? await getTestTemplateById(group.testTemplateId) : null;
  const passingScore = template?.passing_score ?? 60;

  const results = await calculateAttestationResults(sessionId, passingScore, !!template?.use_five_point_scale);
  const timeSpent = capTimeSpent(results.timeSpentSeconds, template?.time_limit_minutes);

  const won = await finishAttestationSession(sessionId, {
    totalPoints: results.totalPoints,
    maxPoints: results.maxPoints,
    scorePercent: results.scorePercent,
    passed: results.passed,
    grade: results.grade,
    timeSpentSeconds: timeSpent,
  });

  if (!won) {
    const fresh = await getAttestationSessionById(sessionId);
    return fresh ? stored(fresh) : null;
  }

  await upsertResultScore(session.groupId, session.instructorId, results.scorePercent);

  return {
    completedNow: true,
    results: {
      total_points: results.totalPoints,
      max_points: results.maxPoints,
      score_percent: results.scorePercent,
      passed: results.passed,
      grade: results.grade,
      answers_count: results.answersCount,
      correct_count: results.correctCount,
      time_spent_seconds: timeSpent,
    },
  };
}

/**
 * Завершить все сессии, у которых истёк лимит времени (плюс запас).
 * Preview-сессии не трогаем: у них нет назначения, а значит и лимита на сервере.
 */
export async function expireOverdueExamSessions(): Promise<{ tests: number; attestation: number }> {
  const overdueTests = await executeQuery<any[]>(
    `SELECT ts.id
       FROM test_sessions ts
       JOIN test_assignments ta ON ta.id = ts.assignment_id
       JOIN test_templates tt ON tt.id = ta.test_template_id
      WHERE ts.status = 'in_progress'
        AND ts.is_preview = FALSE
        AND COALESCE(ta.time_limit_override, tt.time_limit_minutes) > 0
        AND ts.started_at < DATE_SUB(?, INTERVAL (COALESCE(ta.time_limit_override, tt.time_limit_minutes) * 60 + ?) SECOND)`,
    [new Date(), EXAM_GRACE_SECONDS],
  );

  const overdueAttestation = await executeQuery<any[]>(
    `SELECT ats.id
       FROM attestation_test_sessions ats
       JOIN attestation_groups ag ON ag.id = ats.group_id
       JOIN test_templates tt ON tt.id = ag.test_template_id
      WHERE ats.status = 'in_progress'
        AND tt.time_limit_minutes > 0
        AND ats.started_at < DATE_SUB(?, INTERVAL (tt.time_limit_minutes * 60 + ?) SECOND)`,
    [new Date(), EXAM_GRACE_SECONDS],
  );

  let tests = 0;
  for (const row of overdueTests) {
    try {
      if ((await completeTestSession(row.id))?.completedNow) tests++;
    } catch (e) {
      console.error(`[ExpireExams] Не удалось завершить тест ${row.id}:`, e);
    }
  }

  let attestation = 0;
  for (const row of overdueAttestation) {
    try {
      if ((await completeAttestationSession(row.id))?.completedNow) attestation++;
    } catch (e) {
      console.error(`[ExpireExams] Не удалось завершить аттестацию ${row.id}:`, e);
    }
  }

  return { tests, attestation };
}
