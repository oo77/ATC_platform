import { d as defineEventHandler, b as getRouterParam, r as readBody } from '../../../../_/nitro.mjs';
import { q as questionBankCodeExists, u as updateQuestionBank } from '../../../../_/questionBankRepository.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
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
import '../../../../_/activityLogRepository.mjs';

const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    if (!id) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    if (body.code) {
      const codeExists = await questionBankCodeExists(body.code, id);
      if (codeExists) {
        return {
          success: false,
          message: `\u0411\u0430\u043D\u043A \u0441 \u043A\u043E\u0434\u043E\u043C "${body.code}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442`
        };
      }
    }
    const bank = await updateQuestionBank(id, {
      name: body.name?.trim(),
      code: body.code?.trim().toUpperCase(),
      description: body.description?.trim(),
      category: body.category?.trim(),
      is_active: body.is_active
    });
    if (!bank) {
      return {
        success: false,
        message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    await logActivity(
      event,
      "UPDATE",
      "COURSE",
      bank.id,
      bank.name,
      { code: bank.code, updatedFields: Object.keys(body).filter((k) => body[k] !== void 0) }
    );
    return {
      success: true,
      message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D",
      bank
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0431\u0430\u043D\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0431\u0430\u043D\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
