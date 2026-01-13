import { d as defineEventHandler, a as getRouterParam } from '../../../../../nitro/nitro.mjs';
import { g as getTestTemplateById, v as validateLanguagesQuestionCount } from '../../../../../_/testTemplateRepository.mjs';
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

const validateLanguages_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
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
    if (!template.allowed_languages || template.allowed_languages.length === 0) {
      return {
        success: true,
        isValid: true,
        message: "\u042F\u0437\u044B\u043A\u0438 \u043D\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u044B",
        validations: []
      };
    }
    let minQuestions = 1;
    if (template.questions_mode === "random" && template.questions_count) {
      minQuestions = template.questions_count;
    }
    const result = await validateLanguagesQuestionCount(
      template.bank_id,
      template.allowed_languages,
      minQuestions
    );
    return {
      success: true,
      isValid: result.isValid,
      validations: result.validations,
      minQuestions
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u044F\u0437\u044B\u043A\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u044F\u0437\u044B\u043A\u043E\u0432"
    };
  }
});

export { validateLanguages_get as default };
//# sourceMappingURL=validate-languages.get.mjs.map
