import { d as defineEventHandler, a as getRouterParam, g as getQuery } from '../../../../nitro/nitro.mjs';
import { g as getTestTemplateById, a as getTemplateQuestions } from '../../../../_/testTemplateRepository.mjs';
import { l as getQuestionsByIds } from '../../../../_/questionRepository.mjs';
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
    let questions = void 0;
    if (query.include_questions === "true" && template.questions_mode === "manual") {
      const templateQuestions = await getTemplateQuestions(id);
      const questionIds = templateQuestions.map((tq) => tq.question_id);
      if (questionIds.length > 0) {
        const questionsList = await getQuestionsByIds(questionIds);
        questions = templateQuestions.map((tq) => {
          const q = questionsList.find((q2) => q2.id === tq.question_id);
          return {
            ...q,
            order_index: tq.order_index,
            points_override: tq.points_override
          };
        }).filter((q) => q);
      }
    }
    return {
      success: true,
      template,
      questions
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430"
    };
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
