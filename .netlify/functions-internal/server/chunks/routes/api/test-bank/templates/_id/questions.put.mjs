import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../../../nitro/nitro.mjs';
import { g as getTestTemplateById, s as setTemplateQuestions } from '../../../../../_/testTemplateRepository.mjs';
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
import '../../../../../_/questionRepository.mjs';

const questions_put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    if (!id) {
      return {
        success: false,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const template = await getTestTemplateById(id);
    if (!template) {
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    if (template.questions_mode !== "manual") {
      return {
        success: false,
        message: '\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0440\u0435\u0436\u0438\u043C\u0430 "manual"'
      };
    }
    await setTemplateQuestions(id, body.questions || []);
    return {
      success: true,
      message: "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B",
      questionsCount: body.questions?.length || 0
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0448\u0430\u0431\u043B\u043E\u043D\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    };
  }
});

export { questions_put as default };
//# sourceMappingURL=questions.put.mjs.map
