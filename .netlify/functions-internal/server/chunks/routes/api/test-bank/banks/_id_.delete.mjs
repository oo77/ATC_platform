import { d as defineEventHandler, a as getRouterParam } from '../../../../nitro/nitro.mjs';
import { g as getQuestionBankById, d as deleteQuestionBank } from '../../../../_/questionBankRepository.mjs';
import { c as createActivityLog } from '../../../../_/activityLogRepository.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const bank = await getQuestionBankById(id);
    if (!bank) {
      return {
        success: false,
        message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    if (bank.templates_count > 0) {
      return {
        success: false,
        message: `\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0431\u0430\u043D\u043A: \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 ${bank.templates_count} \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0445 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u0442\u0435\u0441\u0442\u043E\u0432`
      };
    }
    const deleted = await deleteQuestionBank(id);
    if (!deleted) {
      return {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0431\u0430\u043D\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"
      };
    }
    const userId = event.context.user?.id;
    if (userId) {
      await createActivityLog({
        userId,
        actionType: "DELETE",
        entityType: "COURSE",
        entityId: id,
        entityName: bank.name
      });
    }
    return {
      success: true,
      message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0451\u043D"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0431\u0430\u043D\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0431\u0430\u043D\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"
    };
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
