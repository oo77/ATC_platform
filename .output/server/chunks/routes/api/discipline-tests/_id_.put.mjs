import { g as defineEventHandler, j as getRouterParam, r as readBody } from '../../../_/nitro.mjs';
import { g as getDisciplineTestById, u as updateDisciplineTest } from '../../../_/disciplineTestRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

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
    await logActivity(
      event,
      "UPDATE",
      "COURSE",
      id,
      "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0438 \u0442\u0435\u0441\u0442\u0430 \u043A \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0435",
      {
        updatedFields: Object.keys(body).filter(
          (k) => body[k] !== void 0
        ),
        disciplineId: existingTest.discipline_id
      }
    );
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
