import { d as defineEventHandler, c as createError, g as getQuery } from '../../nitro/nitro.mjs';
import { a as getFilesPaginated } from '../../_/fileRepository.mjs';
import { s as storage } from '../../_/index.mjs';
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
import '../../_/fileUtils.mjs';

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
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search;
    const category = query.category;
    const userId = query.userId ? parseInt(query.userId) : void 0;
    const courseId = query.courseId ? parseInt(query.courseId) : void 0;
    const groupId = query.groupId ? parseInt(query.groupId) : void 0;
    console.log("Files API - \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0441\u043F\u0438\u0441\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432:", { page, limit, search, category });
    const result = await getFilesPaginated({
      page,
      limit,
      search,
      category,
      userId,
      courseId,
      groupId
    });
    const filesWithUrls = result.data.map((file) => ({
      id: file.id,
      uuid: file.uuid,
      filename: file.filename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      extension: file.extension,
      category: file.category,
      isPublic: file.isPublic,
      url: storage.getPublicUrl(file.uuid),
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
      metadata: file.metadata
    }));
    console.log("Files API - \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0444\u0430\u0439\u043B\u043E\u0432:", filesWithUrls.length);
    return {
      success: true,
      ...result,
      data: filesWithUrls
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432:", error);
    if (error.statusCode) {
      throw error;
    }
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432",
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    };
  }
});

export { index_get as default };
//# sourceMappingURL=index.get6.mjs.map
