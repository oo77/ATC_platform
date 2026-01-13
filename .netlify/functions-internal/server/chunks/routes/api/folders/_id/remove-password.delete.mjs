import { d as defineEventHandler, c as createError, a as getRouterParam, e as executeQuery } from '../../../../nitro/nitro.mjs';
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

const removePassword_delete = defineEventHandler(async (event) => {
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
    const folder = await getFolderById(folderId);
    if (!folder) {
      throw createError({
        statusCode: 404,
        message: "\u041F\u0430\u043F\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (!folder.passwordHash) {
      throw createError({
        statusCode: 400,
        message: "\u041F\u0430\u043F\u043A\u0430 \u043D\u0435 \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u0430 \u043F\u0430\u0440\u043E\u043B\u0435\u043C"
      });
    }
    await executeQuery(
      "UPDATE folders SET password_hash = NULL, updated_at = ? WHERE id = ?",
      [/* @__PURE__ */ new Date(), folderId]
    );
    return {
      success: true,
      message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043F\u0430\u0440\u043E\u043B\u044F:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u043F\u0430\u0440\u043E\u043B\u044F"
    });
  }
});

export { removePassword_delete as default };
//# sourceMappingURL=remove-password.delete.mjs.map
