import { d as defineEventHandler, a as getRouterParam } from '../../../nitro/nitro.mjs';
import { g as getInstructorById } from '../../../_/instructorRepository.mjs';
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
        message: "ID \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const instructor = await getInstructorById(id);
    if (!instructor) {
      return {
        success: false,
        message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    return {
      success: true,
      instructor
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430"
    };
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
