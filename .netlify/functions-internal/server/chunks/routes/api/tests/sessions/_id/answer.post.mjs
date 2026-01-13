import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../../../nitro/nitro.mjs';
import { a as getTestSessionById, s as saveAnswer, u as updateCurrentQuestionIndex } from '../../../../../_/testSessionRepository.mjs';
import { c as getQuestionById } from '../../../../../_/questionRepository.mjs';
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

const answer_post = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    if (!body.question_id) {
      return {
        success: false,
        message: "ID \u0432\u043E\u043F\u0440\u043E\u0441\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.answer_data) {
      return {
        success: false,
        message: "\u041E\u0442\u0432\u0435\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    const session = await getTestSessionById(id);
    if (!session) {
      return {
        success: false,
        message: "\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    if (session.status !== "in_progress") {
      return {
        success: false,
        message: "\u0422\u0435\u0441\u0442 \u0443\u0436\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D"
      };
    }
    const question = await getQuestionById(body.question_id);
    if (!question) {
      return {
        success: false,
        message: "\u0412\u043E\u043F\u0440\u043E\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const answer = await saveAnswer({
      session_id: id,
      question_id: body.question_id,
      answer_data: body.answer_data,
      time_spent_seconds: body.time_spent_seconds
    }, question);
    if (body.question_index !== void 0) {
      await updateCurrentQuestionIndex(id, body.question_index);
    }
    return {
      success: true,
      message: "\u041E\u0442\u0432\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D",
      answer: {
        question_id: answer.question_id,
        is_correct: answer.is_correct,
        // Можно скрыть до конца теста
        points_earned: answer.points_earned
      }
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u043E\u0442\u0432\u0435\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043E\u0442\u0432\u0435\u0442\u0430"
    };
  }
});

export { answer_post as default };
//# sourceMappingURL=answer.post.mjs.map
