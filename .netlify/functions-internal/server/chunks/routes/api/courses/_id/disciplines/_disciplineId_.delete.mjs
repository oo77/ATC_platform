import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../../nitro/nitro.mjs';
import { a as deleteDiscipline } from '../../../../../_/courseRepository.mjs';
import { l as logActivity } from '../../../../../_/activityLogger.mjs';
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
import '../../../../../_/activityLogRepository.mjs';

const _disciplineId__delete = defineEventHandler(async (event) => {
  try {
    const disciplineId = getRouterParam(event, "disciplineId");
    if (!disciplineId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const success = await deleteDiscipline(disciplineId);
    if (!success) {
      throw createError({
        statusCode: 404,
        message: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    await logActivity(
      event,
      "DELETE",
      "DISCIPLINE",
      disciplineId
    );
    return {
      success: true,
      message: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("Error deleting discipline:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0443"
    });
  }
});

export { _disciplineId__delete as default };
//# sourceMappingURL=_disciplineId_.delete.mjs.map
