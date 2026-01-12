import { d as defineEventHandler, a as getRouterParam } from '../../../../../nitro/nitro.mjs';
import { g as getGroupById, r as removeStudentFromGroup } from '../../../../../_/groupRepository.mjs';
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

const _studentId__delete = defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, "id");
    const studentId = getRouterParam(event, "studentId");
    if (!groupId) {
      return {
        success: false,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    if (!studentId) {
      return {
        success: false,
        message: "ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const removed = await removeStudentFromGroup(groupId, studentId);
    if (!removed) {
      return {
        success: false,
        message: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0433\u0440\u0443\u043F\u043F\u0435"
      };
    }
    return {
      success: true,
      message: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u0443\u0434\u0430\u043B\u0451\u043D \u0438\u0437 \u0433\u0440\u0443\u043F\u043F\u044B"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u0438\u0437 \u0433\u0440\u0443\u043F\u043F\u044B"
    };
  }
});

export { _studentId__delete as default };
//# sourceMappingURL=_studentId_.delete.mjs.map
