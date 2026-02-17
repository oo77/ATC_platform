import { g as defineEventHandler, j as getRouterParam, h as createError } from '../../../_/nitro.mjs';
import { d as deleteClassroom } from '../../../_/scheduleRepository.mjs';
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
import '../../../_/timeUtils.mjs';

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const success = await deleteClassroom(id);
    if (!success) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    return {
      success: true,
      message: "\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("Error deleting classroom:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
