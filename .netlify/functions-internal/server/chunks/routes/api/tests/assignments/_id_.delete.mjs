import { d as defineEventHandler, a as getRouterParam } from '../../../../nitro/nitro.mjs';
import { g as getTestAssignmentById, d as deleteTestAssignment } from '../../../../_/testAssignmentRepository.mjs';
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
        message: "ID \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const assignment = await getTestAssignmentById(id);
    if (!assignment) {
      return {
        success: false,
        message: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      };
    }
    if (assignment.sessions_count > 0) {
      return {
        success: false,
        message: `\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C: ${assignment.sessions_count} \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u0443\u0436\u0435 \u043D\u0430\u0447\u0430\u043B\u0438 \u0442\u0435\u0441\u0442`
      };
    }
    const deleted = await deleteTestAssignment(id);
    if (!deleted) {
      return {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F"
      };
    }
    return {
      success: true,
      message: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0442\u0435\u0441\u0442\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u043E"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F"
    };
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
