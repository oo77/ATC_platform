import { d as defineEventHandler, r as readBody } from '../../../nitro/nitro.mjs';
import { t as testTemplateCodeExists, c as createTestTemplate } from '../../../_/testTemplateRepository.mjs';
import { g as getQuestionBankById } from '../../../_/questionBankRepository.mjs';
import { n as getQuestionsCountByBankId } from '../../../_/questionRepository.mjs';
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

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.bank_id) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.name?.trim()) {
      return {
        success: false,
        message: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
      };
    }
    if (!body.code?.trim()) {
      return {
        success: false,
        message: "\u041A\u043E\u0434 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    const bank = await getQuestionBankById(body.bank_id);
    if (!bank) {
      return {
        success: false,
        message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const codeExists = await testTemplateCodeExists(body.code);
    if (codeExists) {
      return {
        success: false,
        message: `\u0428\u0430\u0431\u043B\u043E\u043D \u0441 \u043A\u043E\u0434\u043E\u043C "${body.code}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
      };
    }
    if (body.questions_mode === "random") {
      if (!body.questions_count || body.questions_count < 1) {
        return {
          success: false,
          message: '\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0434\u043B\u044F \u0440\u0435\u0436\u0438\u043C\u0430 "\u0421\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0435"'
        };
      }
      const availableQuestions = await getQuestionsCountByBankId(body.bank_id, true);
      if (body.questions_count > availableQuestions) {
        return {
          success: false,
          message: `\u0412 \u0431\u0430\u043D\u043A\u0435 \u0442\u043E\u043B\u044C\u043A\u043E ${availableQuestions} \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432`
        };
      }
    }
    const userId = event.context.user?.id;
    const template = await createTestTemplate({
      bank_id: body.bank_id,
      name: body.name.trim(),
      code: body.code.trim().toUpperCase(),
      description: body.description?.trim(),
      questions_mode: body.questions_mode || "all",
      questions_count: body.questions_count,
      time_limit_minutes: body.time_limit_minutes,
      passing_score: body.passing_score || 60,
      max_attempts: body.max_attempts || 1,
      shuffle_questions: body.shuffle_questions !== false,
      shuffle_options: body.shuffle_options !== false,
      questions_per_page: body.questions_per_page || 1,
      show_results: body.show_results || "immediately",
      allow_back: body.allow_back !== false,
      proctoring_enabled: body.proctoring_enabled || false,
      proctoring_settings: body.proctoring_settings,
      allowed_languages: body.allowed_languages,
      is_active: body.is_active !== false
    }, userId);
    return {
      success: true,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D",
      template
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post3.mjs.map
