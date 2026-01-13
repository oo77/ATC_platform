import { d as defineEventHandler, r as readBody } from '../../../../nitro/nitro.mjs';
import { j as updateQuestionsOrder } from '../../../../_/questionRepository.mjs';
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

const reorder_put = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.orders?.length) {
      return {
        success: false,
        message: "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u0440\u044F\u0434\u043A\u0430 \u043F\u0443\u0441\u0442"
      };
    }
    await updateQuestionsOrder(body.orders);
    return {
      success: true,
      message: "\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u043E\u0440\u044F\u0434\u043A\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u043E\u0440\u044F\u0434\u043A\u0430"
    };
  }
});

export { reorder_put as default };
//# sourceMappingURL=reorder.put.mjs.map
