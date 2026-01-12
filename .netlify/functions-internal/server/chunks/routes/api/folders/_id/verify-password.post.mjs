import { d as defineEventHandler, c as createError, a as getRouterParam, r as readBody } from '../../../../nitro/nitro.mjs';
import bcrypt from 'bcryptjs';
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
import 'crypto';
import 'jsonwebtoken';

const verifyPassword_post = defineEventHandler(async (event) => {
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
    const { password } = body;
    if (!password) {
      throw createError({
        statusCode: 400,
        message: "\u041F\u0430\u0440\u043E\u043B\u044C \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
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
    const isValid = await bcrypt.compare(password, folder.passwordHash);
    if (!isValid) {
      throw createError({
        statusCode: 403,
        message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C"
      });
    }
    return {
      success: true,
      message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0432\u0435\u0440\u043D\u044B\u0439",
      folderId
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043F\u0430\u0440\u043E\u043B\u044F:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435 \u043F\u0430\u0440\u043E\u043B\u044F"
    });
  }
});

export { verifyPassword_post as default };
//# sourceMappingURL=verify-password.post.mjs.map
