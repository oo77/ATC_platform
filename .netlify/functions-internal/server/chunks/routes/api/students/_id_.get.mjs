import { d as defineEventHandler, a as getRouterParam } from '../../../nitro/nitro.mjs';
import { a as getStudentById } from '../../../_/studentRepository.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const student = await getStudentById(id);
    if (!student) {
      return {
        success: false,
        message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    return {
      success: true,
      student
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430"
    };
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
