import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../nitro/nitro.mjs';
import { g as getDisciplineTestById, u as updateDisciplineTest } from '../../../_/disciplineTestRepository.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const existingTest = await getDisciplineTestById(id);
    if (!existingTest) {
      return {
        success: false,
        message: "\u041F\u0440\u0438\u0432\u044F\u0437\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const body = await readBody(event);
    const updated = await updateDisciplineTest(id, {
      is_required: body.is_required,
      order_index: body.order_index,
      notes: body.notes
    });
    if (!updated) {
      return {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438"
      };
    }
    return {
      success: true,
      message: "\u041F\u0440\u0438\u0432\u044F\u0437\u043A\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430",
      disciplineTest: updated
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
