import { d as defineEventHandler, g as getQuery } from '../../../../nitro/nitro.mjs';
import { k as getFullLanguageStats } from '../../../../_/questionRepository.mjs';
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

const statsByLanguage_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const bankId = query.bank_id;
    if (!bankId) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D",
        stats: []
      };
    }
    const stats = await getFullLanguageStats(bankId, true);
    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u043F\u043E \u044F\u0437\u044B\u043A\u0430\u043C:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438",
      stats: []
    };
  }
});

export { statsByLanguage_get as default };
//# sourceMappingURL=stats-by-language.get.mjs.map
