import { d as defineEventHandler, a as getRouterParam, c as createError, s as setHeader } from '../../../nitro/nitro.mjs';
import { g as getFileByUuid } from '../../../_/fileRepository.mjs';
import { s as storage } from '../../../_/index.mjs';
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
import 'fs/promises';
import 'path';
import '../../../_/fileUtils.mjs';

const _uuid__get = defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw createError({
        statusCode: 400,
        message: "UUID \u0444\u0430\u0439\u043B\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const fileRecord = await getFileByUuid(uuid);
    if (!fileRecord) {
      throw createError({
        statusCode: 404,
        message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const user = event.context.user;
    if (!fileRecord.isPublic && !user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    if (!fileRecord.isPublic) {
      switch (fileRecord.accessLevel) {
        case "owner":
          if (!user || user.id !== fileRecord.uploadedBy && user.id !== fileRecord.userId) {
            throw createError({
              statusCode: 403,
              message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D"
            });
          }
          break;
        case "admin":
          if (!user || user.role !== "ADMIN") {
            throw createError({
              statusCode: 403,
              message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D"
            });
          }
          break;
        case "authenticated":
          break;
        case "public":
          break;
      }
    }
    const fileData = await storage.get(fileRecord.fullPath);
    setHeader(event, "Content-Type", fileRecord.mimeType);
    setHeader(event, "Content-Length", fileRecord.sizeBytes.toString());
    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileRecord.filename)}"`
    );
    if (fileRecord.isPublic) {
      setHeader(event, "Cache-Control", "public, max-age=31536000");
    }
    return fileData;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u0430"
    });
  }
});

export { _uuid__get as default };
//# sourceMappingURL=_uuid_.get.mjs.map
