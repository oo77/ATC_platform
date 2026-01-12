import { d as defineEventHandler, a as getRouterParam, g as getQuery } from '../../../../nitro/nitro.mjs';
import { a as getTestSessionById, b as getSessionAnswers } from '../../../../_/testSessionRepository.mjs';
import { l as getQuestionsByIds } from '../../../../_/questionRepository.mjs';
import { g as getTestAssignmentById } from '../../../../_/testAssignmentRepository.mjs';
import { g as getTestTemplateById } from '../../../../_/testTemplateRepository.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';

const _id__get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const query = getQuery(event);
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const session = await getTestSessionById(id);
    if (!session) {
      return {
        success: false,
        message: "\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    let templateSettings = null;
    if (session.assignment_id) {
      const assignment = await getTestAssignmentById(session.assignment_id);
      if (assignment) {
        const template = await getTestTemplateById(assignment.test_template_id);
        if (template) {
          templateSettings = {
            name: template.name,
            time_limit_minutes: assignment.time_limit_override || template.time_limit_minutes,
            passing_score: assignment.passing_score_override || template.passing_score,
            allow_back: template.allow_back,
            proctoring_enabled: template.proctoring_enabled,
            proctoring_settings: template.proctoring_settings,
            show_results: template.show_results
          };
        }
      }
    }
    let questions = void 0;
    if (query.include_questions === "true" && session.questions_order) {
      const questionIds = session.questions_order.map((q) => q.questionId);
      const questionsList = await getQuestionsByIds(questionIds);
      const includeCorrectAnswers = query.include_correct_answers === "true" && session.is_preview;
      questions = session.questions_order.map((qo) => {
        const question = questionsList.find((q) => q.id === qo.questionId);
        if (!question) return null;
        const cleanOptions = { ...question.options };
        if (cleanOptions.options) {
          cleanOptions.options = cleanOptions.options.map((o) => ({
            id: o.id,
            text: o.text,
            // Включаем correct только для preview
            ...includeCorrectAnswers ? { correct: o.correct } : {}
          }));
          if (qo.shuffledOptions) {
            cleanOptions.options = qo.shuffledOptions.map(
              (optId) => cleanOptions.options.find((o) => o.id === optId)
            ).filter(Boolean);
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
          // Добавляем explanation для preview
          ...includeCorrectAnswers && question.explanation ? { explanation: question.explanation } : {}
        };
      }).filter(Boolean);
    }
    let answers = void 0;
    if (query.include_answers === "true") {
      const answersList = await getSessionAnswers(id);
      answers = answersList.map((a) => ({
        question_id: a.question_id,
        answer_data: a.answer_data,
        answered_at: a.answered_at
      }));
    }
    return {
      success: true,
      session: {
        id: session.id,
        status: session.status,
        is_preview: session.is_preview,
        current_question_index: session.current_question_index,
        started_at: session.started_at,
        completed_at: session.completed_at,
        time_spent_seconds: session.time_spent_seconds,
        template_name: session.template_name || templateSettings?.name,
        // Результаты только если тест завершён
        ...session.status === "completed" ? {
          total_points: session.total_points,
          max_points: session.max_points,
          score_percent: session.score_percent,
          passed: session.passed,
          grade: session.grade
        } : {}
      },
      templateSettings,
      questions,
      answers,
      questions_count: session.questions_order?.length || 0
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0438:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0438"
    };
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
