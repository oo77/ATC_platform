import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../../nitro/nitro.mjs';
import { t as testTemplateCodeExists, u as updateTestTemplate } from '../../../../_/testTemplateRepository.mjs';
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
import '../../../../_/questionRepository.mjs';

const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    if (!id) {
      return {
        success: false,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    if (body.code) {
      const codeExists = await testTemplateCodeExists(body.code, id);
      if (codeExists) {
        return {
          success: false,
          message: `\u0428\u0430\u0431\u043B\u043E\u043D \u0441 \u043A\u043E\u0434\u043E\u043C "${body.code}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
        };
      }
    }
    const template = await updateTestTemplate(id, {
      name: body.name?.trim(),
      code: body.code?.trim().toUpperCase(),
      description: body.description?.trim(),
      questions_mode: body.questions_mode,
      questions_count: body.questions_count,
      time_limit_minutes: body.time_limit_minutes,
      passing_score: body.passing_score,
      max_attempts: body.max_attempts,
      shuffle_questions: body.shuffle_questions,
      shuffle_options: body.shuffle_options,
      questions_per_page: body.questions_per_page,
      show_results: body.show_results,
      allow_back: body.allow_back,
      proctoring_enabled: body.proctoring_enabled,
      proctoring_settings: body.proctoring_settings,
      allowed_languages: body.allowed_languages,
      is_active: body.is_active
    });
    if (!template) {
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    return {
      success: true,
      message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D",
      template
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
