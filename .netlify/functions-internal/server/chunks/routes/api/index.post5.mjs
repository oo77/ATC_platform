import { d as defineEventHandler, c as createError, r as readBody } from '../../nitro/nitro.mjs';
import { getFolderById, getFolderByPath, createFolder } from '../../_/folderRepository.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
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
import '../../_/activityLogRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const body = await readBody(event);
    if (!body.name || !body.name.trim()) {
      return {
        success: false,
        message: "\u0418\u043C\u044F \u043F\u0430\u043F\u043A\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
      };
    }
    const folderName = body.name.trim();
    const parentId = body.parentId || null;
    let expectedPath;
    if (parentId) {
      const parentFolder = await getFolderById(parentId);
      if (!parentFolder) {
        return {
          success: false,
          message: "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u043F\u0430\u043F\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        };
      }
      expectedPath = `${parentFolder.path}/${folderName}`;
    } else {
      expectedPath = `/${folderName}`;
    }
    const existingFolder = await getFolderByPath(expectedPath);
    if (existingFolder) {
      return {
        success: true,
        folder: existingFolder,
        message: "\u041F\u0430\u043F\u043A\u0430 \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
      };
    }
    const folder = await createFolder({
      name: folderName,
      parentId,
      userId: user.id
    });
    await logActivity(
      event,
      "CREATE",
      "FOLDER",
      String(folder.id),
      folder.name,
      { path: folder.path }
    );
    return {
      success: true,
      folder
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    return {
      success: false,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u0430\u043F\u043A\u0438"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post5.mjs.map
