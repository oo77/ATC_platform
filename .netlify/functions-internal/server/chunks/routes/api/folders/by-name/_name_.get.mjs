import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { getFolderByPath } from '../../../../_/folderRepository.mjs';
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

const _name__get = defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, "name");
    if (!name) {
      throw createError({
        statusCode: 400,
        message: "\u0418\u043C\u044F \u043F\u0430\u043F\u043A\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E"
      });
    }
    const folder = await getFolderByPath(`/${name}`);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: `\u041F\u0430\u043F\u043A\u0430 "${name}" \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430`
      });
    }
    return {
      success: true,
      folder: {
        id: folder.id,
        uuid: folder.uuid,
        name: folder.name,
        parentId: folder.parentId,
        path: folder.path,
        isSystem: folder.isSystem
      }
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u0430\u043F\u043A\u0438"
    });
  }
});

export { _name__get as default };
//# sourceMappingURL=_name_.get.mjs.map
