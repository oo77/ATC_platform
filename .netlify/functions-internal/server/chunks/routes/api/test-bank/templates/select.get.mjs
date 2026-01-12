import { d as defineEventHandler, g as getQuery } from '../../../../nitro/nitro.mjs';
import { e as getActiveTemplatesForSelect } from '../../../../_/testTemplateRepository.mjs';
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

const select_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const bankId = query.bank_id;
    const templates = await getActiveTemplatesForSelect(bankId);
    return {
      success: true,
      templates
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432",
      templates: []
    };
  }
});

export { select_get as default };
//# sourceMappingURL=select.get.mjs.map
