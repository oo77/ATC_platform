import { d as defineEventHandler, c as createError, g as getQuery } from '../../nitro/nitro.mjs';
import { getRootFolders, getSubFolders } from '../../_/folderRepository.mjs';
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

const index_get = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const query = getQuery(event);
    const parentId = query.parentId ? parseInt(query.parentId) : null;
    const folders = parentId === null ? await getRootFolders() : await getSubFolders(parentId);
    return {
      success: true,
      folders
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0430\u043F\u043E\u043A:", error);
    if (error.statusCode) {
      throw error;
    }
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u0430\u043F\u043E\u043A",
      folders: []
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get7.mjs.map
