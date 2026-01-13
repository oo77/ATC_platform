import { d as defineEventHandler, c as createError, a as getRouterParam } from '../../../../nitro/nitro.mjs';
import { getFolderById } from '../../../../_/folderRepository.mjs';
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

const path_get = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const id = getRouterParam(event, "id");
    if (!id || id === "root" || id === "null") {
      return {
        success: true,
        path: []
      };
    }
    const folderId = parseInt(id);
    if (isNaN(folderId)) {
      return {
        success: true,
        path: []
      };
    }
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u0430\u043F\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const pathElements = [];
    let currentFolder = folder;
    const visited = /* @__PURE__ */ new Set();
    while (currentFolder) {
      if (visited.has(currentFolder.id)) {
        break;
      }
      visited.add(currentFolder.id);
      pathElements.unshift({
        id: currentFolder.id,
        name: currentFolder.name
      });
      if (currentFolder.parentId === null) {
        break;
      }
      const parentFolder = await getFolderById(currentFolder.parentId);
      if (!parentFolder) {
        break;
      }
      currentFolder = parentFolder;
    }
    return {
      success: true,
      path: pathElements,
      currentFolder: {
        id: folder.id,
        name: folder.name,
        path: folder.path
      }
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0443\u0442\u0438 \u043F\u0430\u043F\u043A\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u0443\u0442\u0438 \u043F\u0430\u043F\u043A\u0438",
      path: []
    };
  }
});

export { path_get as default };
//# sourceMappingURL=path.get.mjs.map
