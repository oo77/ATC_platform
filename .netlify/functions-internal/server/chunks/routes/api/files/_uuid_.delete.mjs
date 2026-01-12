import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { g as getFileByUuid, d as deleteFile } from '../../../_/fileRepository.mjs';
import { s as storage } from '../../../_/index.mjs';
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
import 'fs/promises';
import 'path';
import '../../../_/fileUtils.mjs';
import '../../../_/activityLogRepository.mjs';

const _uuid__delete = defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw createError({
        statusCode: 400,
        message: "UUID \u0444\u0430\u0439\u043B\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const fileRecord = await getFileByUuid(uuid);
    if (!fileRecord) {
      return {
        success: false,
        message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const isOwner = user.id === fileRecord.uploadedBy || user.id === fileRecord.userId;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u044D\u0442\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430"
      });
    }
    const deleted = await deleteFile(uuid);
    if (!deleted) {
      return {
        success: false,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u0430\u0439\u043B \u0438\u0437 \u0431\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445"
      };
    }
    try {
      await storage.delete(fileRecord.fullPath);
    } catch (error) {
      console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0444\u0430\u0439\u043B:", error);
    }
    await logActivity(
      event,
      "DELETE",
      "FILE",
      uuid,
      fileRecord.filename,
      { mimeType: fileRecord.mimeType, sizeBytes: fileRecord.sizeBytes }
    );
    return {
      success: true,
      message: "\u0424\u0430\u0439\u043B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0451\u043D"
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u0430"
    };
  }
});

export { _uuid__delete as default };
//# sourceMappingURL=_uuid_.delete.mjs.map
