import { g as defineEventHandler, h as createError, j as getRouterParam, f as executeQuery } from '../../../_/nitro.mjs';
import { g as getGroupById, d as deleteGroup } from '../../../_/groupRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import { g as getGroupReportFiles, d as deleteGroupReportFile } from '../../../_/groupFileStorage.mjs';
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
import 'fs/promises';
import 'path';

const _id__delete = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message: "\u0422\u043E\u043B\u044C\u043A\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u0443\u0434\u0430\u043B\u044F\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u044B. \u0414\u043B\u044F \u0441\u043A\u0440\u044B\u0442\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0430\u0440\u0445\u0438\u0432\u0430\u0446\u0438\u044E."
    });
  }
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D" });
    }
    const group = await getGroupById(id);
    if (!group) {
      throw createError({ statusCode: 404, message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
    }
    const groupCode = group.code;
    await executeQuery(
      "DELETE FROM files WHERE group_id = ? AND category = ?",
      [id, "group_report"]
    );
    try {
      const files = await getGroupReportFiles(id);
      for (const file of files) {
        await deleteGroupReportFile(file);
      }
    } catch (e) {
      console.warn("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0447\u0438\u0441\u0442\u043A\u0435 \u0444\u0430\u0439\u043B\u043E\u0432 \u0433\u0440\u0443\u043F\u043F\u044B:", e);
    }
    const deleted = await deleteGroup(id);
    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443"
      });
    }
    await logActivity(event, "DELETE", "GROUP", id, groupCode, {
      studentsCount: group.students?.length || 0
    });
    return {
      success: true,
      message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0438 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u044B"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
