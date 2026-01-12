import { d as defineEventHandler, c as createError, a as getRouterParam, r as readBody } from '../../../../nitro/nitro.mjs';
import { getFolderById, moveFolder } from '../../../../_/folderRepository.mjs';
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

const move_put = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const id = getRouterParam(event, "id");
    const folderId = id ? parseInt(id) : null;
    if (!folderId) {
      throw createError({
        statusCode: 400,
        message: "ID \u043F\u0430\u043F\u043A\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const body = await readBody(event);
    const { newParentId } = body;
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u0430\u043F\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (folder.isSystem) {
      throw createError({
        statusCode: 403,
        message: "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u043F\u0430\u043F\u043A\u0438 \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0430\u0442\u044C"
      });
    }
    const success = await moveFolder(folderId, newParentId || null);
    if (!success) {
      throw createError({
        statusCode: 500,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043F\u0430\u043F\u043A\u0443"
      });
    }
    await logActivity(
      event,
      "UPDATE",
      "FOLDER",
      String(folderId),
      folder.name,
      { action: "move", newParentId }
    );
    return {
      success: true,
      message: "\u041F\u0430\u043F\u043A\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u0438 \u043F\u0430\u043F\u043A\u0438"
    });
  }
});

export { move_put as default };
//# sourceMappingURL=move.put.mjs.map
