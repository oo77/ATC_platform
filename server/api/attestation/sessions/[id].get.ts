/**
 * Текущее состояние сессии аттестационного теста
 * GET /api/attestation/sessions/:id
 */

import { getSessionById, getSessionAnswers } from "../../../repositories/attestationSessionRepository";
import { getQuestionsByIds } from "../../../repositories/questionRepository";
import { getAttestationGroupById } from "../../../repositories/attestationGroupRepository";
import { getTestTemplateById } from "../../../repositories/testTemplateRepository";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const query = getQuery(event);
    if (!id) return { success: false, message: "ID сессии не указан" };

    const session = await getSessionById(id);
    if (!session) return { success: false, message: "Сессия не найдена" };

    let templateSettings = null;
    const group = await getAttestationGroupById(session.groupId);
    if (group?.testTemplateId) {
      const template = await getTestTemplateById(group.testTemplateId);
      if (template) {
        templateSettings = {
          name: template.name,
          time_limit_minutes: template.time_limit_minutes,
          passing_score: template.passing_score,
          allow_back: template.allow_back,
        };
      }
    }

    let questions = undefined;
    if (query.include_questions === "true" && session.questionsOrder) {
      const questionIds = session.questionsOrder.map((q) => q.questionId);
      const questionsList = await getQuestionsByIds(questionIds);

      questions = session.questionsOrder
        .map((qo) => {
          const question = questionsList.find((q) => q.id === qo.questionId);
          if (!question) return null;

          const cleanOptions = { ...question.options } as any;
          if (cleanOptions.options) {
            cleanOptions.options = cleanOptions.options.map((o: any) => ({
              id: o.id,
              text: o.text,
            }));
            if (qo.shuffledOptions) {
              cleanOptions.options = qo.shuffledOptions
                .map((optId: string) => cleanOptions.options.find((o: any) => o.id === optId))
                .filter(Boolean);
            }
          }

          return {
            id: question.id,
            question_type: question.question_type,
            question_text: question.question_text,
            question_media: question.question_media,
            options: cleanOptions,
            points: question.points,
            difficulty: question.difficulty,
          };
        })
        .filter(Boolean);
    }

    let answers = undefined;
    if (query.include_answers === "true") {
      const answersList = await getSessionAnswers(id);
      answers = answersList.map((a) => ({
        question_id: a.questionId,
        answer_data: a.answerData,
        answered_at: a.answeredAt,
      }));
    }

    return {
      success: true,
      session: {
        id: session.id,
        group_id: session.groupId,
        status: session.status,
        current_question_index: session.currentQuestionIndex,
        started_at: session.startedAt,
        completed_at: session.completedAt,
        time_spent_seconds: session.timeSpentSeconds,
        template_name: templateSettings?.name,
        ...(session.status === "completed"
          ? {
              total_points: session.totalPoints,
              max_points: session.maxPoints,
              score_percent: session.scorePercent,
              passed: session.passed,
              grade: session.grade,
            }
          : {}),
      },
      templateSettings,
      questions,
      answers,
      questions_count: session.questionsOrder?.length || 0,
    };
  } catch (error) {
    console.error("Ошибка получения сессии аттестации:", error);
    return { success: false, message: "Ошибка при получении сессии" };
  }
});
