import { d as defineEventHandler, r as readBody } from '../../nitro/nitro.mjs';
import { b as disciplineTestExists, c as createDisciplineTest } from '../../_/disciplineTestRepository.mjs';
import { g as getTestTemplateById } from '../../_/testTemplateRepository.mjs';
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
import '../../_/questionRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.discipline_id) {
      return {
        success: false,
        message: "ID \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.test_template_id) {
      return {
        success: false,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    const template = await getTestTemplateById(body.test_template_id);
    if (!template) {
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const exists = await disciplineTestExists(body.discipline_id, body.test_template_id);
    if (exists) {
      return {
        success: false,
        message: "\u042D\u0442\u043E\u0442 \u0442\u0435\u0441\u0442 \u0443\u0436\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0435"
      };
    }
    const disciplineTest = await createDisciplineTest({
      discipline_id: body.discipline_id,
      test_template_id: body.test_template_id,
      is_required: body.is_required,
      notes: body.notes
    });
    return {
      success: true,
      message: "\u0422\u0435\u0441\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0435",
      disciplineTest
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438 \u0442\u0435\u0441\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0435 \u0442\u0435\u0441\u0442\u0430 \u043A \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0435"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post3.mjs.map
