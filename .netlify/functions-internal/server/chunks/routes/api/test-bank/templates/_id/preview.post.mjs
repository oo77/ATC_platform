import { d as defineEventHandler, c as createError, a as getRouterParam } from '../../../../../nitro/nitro.mjs';
import { g as getTestTemplateById } from '../../../../../_/testTemplateRepository.mjs';
import { c as createTestSession } from '../../../../../_/testSessionRepository.mjs';
import { m as getQuestionsByBankId } from '../../../../../_/questionRepository.mjs';
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

const preview_post = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const allowedRoles = ["ADMIN", "MANAGER", "TEACHER"];
    if (!allowedRoles.includes(user.role)) {
      throw createError({
        statusCode: 403,
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0442\u0435\u0441\u0442\u0430"
      });
    }
    const templateId = getRouterParam(event, "id");
    if (!templateId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const template = await getTestTemplateById(templateId);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const allQuestions = await getQuestionsByBankId(template.bank_id, true);
    if (allQuestions.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u0412 \u0431\u0430\u043D\u043A\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"
      });
    }
    let selectedQuestions = [...allQuestions];
    if (template.questions_mode === "random" && template.questions_count) {
      selectedQuestions = shuffleArray(selectedQuestions).slice(0, template.questions_count);
    } else if (template.questions_mode === "all") {
      selectedQuestions = allQuestions;
    }
    if (template.shuffle_questions) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }
    const questionsOrder = selectedQuestions.map((q) => ({
      questionId: q.id,
      shuffledOptions: template.shuffle_options ? shuffleArray(
        q.options?.options?.map((opt) => opt.id) || []
      ) : void 0
    }));
    const session = await createTestSession(
      {
        assignment_id: null,
        // Preview-сессии не привязаны к assignment
        student_id: null,
        // Preview запускает преподаватель/админ, не студент
        preview_user_id: user.id,
        // ID пользователя, запустившего preview
        is_preview: true,
        ip_address: event.node.req.socket.remoteAddress,
        user_agent: event.node.req.headers["user-agent"]
      },
      questionsOrder
    );
    return {
      success: true,
      session_id: session.id,
      template: {
        id: template.id,
        name: template.name,
        time_limit_minutes: template.time_limit_minutes,
        passing_score: template.passing_score,
        allow_back: template.allow_back,
        proctoring_enabled: false
        // Отключаем прокторинг для preview
      },
      questions_count: questionsOrder.length
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F preview-\u0441\u0435\u0441\u0441\u0438\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F preview-\u0441\u0435\u0441\u0441\u0438\u0438"
    });
  }
});
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export { preview_post as default };
//# sourceMappingURL=preview.post.mjs.map
