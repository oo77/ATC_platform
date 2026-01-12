import { d as defineEventHandler } from '../../../../nitro/nitro.mjs';
import { e as getActiveBanksForSelect } from '../../../../_/questionBankRepository.mjs';
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

const select_get = defineEventHandler(async () => {
  try {
    const banks = await getActiveBanksForSelect();
    return {
      success: true,
      banks
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0431\u0430\u043D\u043A\u043E\u0432 \u0434\u043B\u044F \u0432\u044B\u0431\u043E\u0440\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0431\u0430\u043D\u043A\u043E\u0432",
      banks: []
    };
  }
});

export { select_get as default };
//# sourceMappingURL=select.get.mjs.map
