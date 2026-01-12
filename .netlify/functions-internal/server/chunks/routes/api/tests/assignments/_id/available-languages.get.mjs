import { d as defineEventHandler, a as getRouterParam } from '../../../../../nitro/nitro.mjs';
import { g as getTestAssignmentById } from '../../../../../_/testAssignmentRepository.mjs';
import { f as getAvailableLanguagesForTemplate } from '../../../../../_/testTemplateRepository.mjs';
import { L as LANGUAGE_FLAGS, a as LANGUAGE_LABELS } from '../../../../../_/questionRepository.mjs';
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

const availableLanguages_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
        languages: []
      };
    }
    const assignment = await getTestAssignmentById(id);
    if (!assignment) {
      return {
        success: false,
        message: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E",
        languages: []
      };
    }
    const availableLanguages = await getAvailableLanguagesForTemplate(assignment.test_template_id);
    const languages = availableLanguages.map((lang) => ({
      value: lang,
      label: LANGUAGE_LABELS[lang],
      flag: LANGUAGE_FLAGS[lang]
    }));
    return {
      success: true,
      languages
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u044F\u0437\u044B\u043A\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u044F\u0437\u044B\u043A\u043E\u0432",
      languages: []
    };
  }
});

export { availableLanguages_get as default };
//# sourceMappingURL=available-languages.get.mjs.map
