import { d as defineEventHandler, a as getRouterParam } from '../../../nitro/nitro.mjs';
import { g as getGroupById, d as deleteGroup } from '../../../_/groupRepository.mjs';
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
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const group = await getGroupById(id);
    if (!group) {
      return {
        success: false,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const groupCode = group.code;
    const deleted = await deleteGroup(id);
    if (!deleted) {
      return {
        success: false,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443"
      };
    }
    await logActivity(
      event,
      "DELETE",
      "GROUP",
      id,
      groupCode,
      { studentsCount: group.students?.length || 0 }
    );
    return {
      success: true,
      message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B"
    };
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
