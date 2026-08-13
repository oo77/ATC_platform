/**
 * Завершить аттестационный тест
 * POST /api/attestation/sessions/:id/finish
 */

import {
  getSessionById,
  finishSession,
  calculateSessionResults,
} from "../../../../repositories/attestationSessionRepository";
import { getAttestationGroupById } from "../../../../repositories/attestationGroupRepository";
import { getTestTemplateById } from "../../../../repositories/testTemplateRepository";
import { upsertResultScore } from "../../../../repositories/attestationResultRepository";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) return { success: false, message: "ID сессии не указан" };

    const session = await getSessionById(id);
    if (!session) return { success: false, message: "Сессия не найдена" };

    if (session.status !== "in_progress") {
      if (session.status === "completed") {
        return {
          success: true,
          message: "Тест уже завершён",
          results: {
            total_points: session.totalPoints,
            max_points: session.maxPoints,
            score_percent: session.scorePercent,
            passed: session.passed,
            grade: session.grade,
          },
        };
      }
      return { success: false, message: "Невозможно завершить тест в текущем статусе" };
    }

    const group = await getAttestationGroupById(session.groupId);
    const template = group?.testTemplateId ? await getTestTemplateById(group.testTemplateId) : null;
    const passingScore = template?.passing_score ?? 60;

    const results = await calculateSessionResults(id, passingScore);

    await finishSession(id, {
      totalPoints: results.totalPoints,
      maxPoints: results.maxPoints,
      scorePercent: results.scorePercent,
      passed: results.passed,
      grade: results.grade,
      timeSpentSeconds: results.timeSpentSeconds,
    });

    await upsertResultScore(session.groupId, session.instructorId, results.scorePercent);

    return {
      success: true,
      message: results.passed ? "Тест успешно сдан!" : "Тест завершён",
      results: {
        total_points: results.totalPoints,
        max_points: results.maxPoints,
        score_percent: results.scorePercent,
        passed: results.passed,
        grade: results.grade,
        answers_count: results.answersCount,
        correct_count: results.correctCount,
        time_spent_seconds: results.timeSpentSeconds,
      },
    };
  } catch (error) {
    console.error("Ошибка завершения аттестационного теста:", error);
    return { success: false, message: "Ошибка при завершении теста" };
  }
});
