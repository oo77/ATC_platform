/**
 * Сохранить ответ в аттестационной сессии
 * POST /api/attestation/sessions/:id/answer
 */

import {
  getSessionById,
  saveAnswer,
  updateCurrentQuestionIndex,
} from "../../../../repositories/attestationSessionRepository";
import { getQuestionById } from "../../../../repositories/questionRepository";
import type { AnswerData } from "../../../../types/testing";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody<{
      question_id: string;
      answer_data: AnswerData;
      time_spent_seconds?: number;
      question_index?: number;
    }>(event);

    if (!id) return { success: false, message: "ID сессии не указан" };
    if (!body.question_id) return { success: false, message: "ID вопроса обязателен" };
    if (!body.answer_data) return { success: false, message: "Ответ обязателен" };

    const session = await getSessionById(id);
    if (!session) return { success: false, message: "Сессия не найдена" };
    if (session.status !== "in_progress") return { success: false, message: "Тест уже завершён" };

    const question = await getQuestionById(body.question_id);
    if (!question) return { success: false, message: "Вопрос не найден" };

    const answer = await saveAnswer(
      {
        sessionId: id,
        questionId: body.question_id,
        answerData: body.answer_data,
        timeSpentSeconds: body.time_spent_seconds,
      },
      question
    );

    if (body.question_index !== undefined) {
      await updateCurrentQuestionIndex(id, body.question_index);
    }

    return {
      success: true,
      message: "Ответ сохранён",
      answer: {
        question_id: answer.questionId,
        is_correct: answer.isCorrect,
        points_earned: answer.pointsEarned,
      },
    };
  } catch (error) {
    console.error("Ошибка сохранения ответа:", error);
    return { success: false, message: "Ошибка при сохранении ответа" };
  }
});
