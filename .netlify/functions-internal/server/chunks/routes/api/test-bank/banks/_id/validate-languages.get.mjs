import { d as defineEventHandler, a as getRouterParam, g as getQuery } from '../../../../../nitro/nitro.mjs';
import { v as validateLanguagesQuestionCount } from '../../../../../_/testTemplateRepository.mjs';
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
    const bankId = getRouterParam(event, "id");
    const query = getQuery(event);
    if (!bankId) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
        validation: []
      };
    }
    const minCount = parseInt(query.min_count) || 1;
    const languagesStr = query.languages || "ru";
    const languages = languagesStr.split(",").filter((l) => ["ru", "uz", "en"].includes(l));
    if (languages.length === 0) {
      return {
        success: true,
        isValid: true,
        validation: []
      };
    }
    const result = await validateLanguagesQuestionCount(bankId, languages, minCount);
    return {
      success: true,
      isValid: result.isValid,
      validation: result.validations,
      minCount
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u044F\u0437\u044B\u043A\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u044F\u0437\u044B\u043A\u043E\u0432",
      validation: []
    };
  }
});

export { validateLanguages_get as default };
//# sourceMappingURL=validate-languages.get.mjs.map
