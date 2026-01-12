import { d as defineEventHandler, c as createError, a as getRouterParam, e as executeQuery } from '../../../../nitro/nitro.mjs';
import { getFolderById, getSubFolders } from '../../../../_/folderRepository.mjs';
import { s as storage } from '../../../../_/index.mjs';
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
import '../../../../_/fileUtils.mjs';

const contents_get = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    console.log("[API /folders/[id]/contents] User:", user?.id);
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const id = getRouterParam(event, "id");
    const folderId = id === "root" ? null : id ? parseInt(id) : null;
    console.log("[API /folders/[id]/contents] ID from route:", id, "folderId:", folderId);
    if (folderId !== null) {
      const folder = await getFolderById(folderId);
      if (!folder) {
        throw createError({
          statusCode: 404,
          message: "\u041F\u0430\u043F\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        });
      }
    }
    console.log("[API /folders/[id]/contents] \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u043E\u0434\u043F\u0430\u043F\u043E\u043A \u0434\u043B\u044F folderId:", folderId);
    const folders = await getSubFolders(folderId);
    const query = folderId === null ? "SELECT id, uuid, filename, mime_type, size_bytes, extension, category, is_public, created_at FROM files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY filename ASC" : "SELECT id, uuid, filename, mime_type, size_bytes, extension, category, is_public, created_at FROM files WHERE folder_id = ? AND deleted_at IS NULL ORDER BY filename ASC";
    const params = folderId === null ? [] : [folderId];
    const fileRows = await executeQuery(query, params);
    const files = fileRows.map((row) => ({
      id: row.id,
      uuid: row.uuid,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      extension: row.extension,
      category: row.category,
      isPublic: row.is_public,
      url: storage.getPublicUrl(row.uuid),
      createdAt: row.created_at
    }));
    return {
      success: true,
      folders,
      files
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u043F\u0430\u043F\u043A\u0438:", error);
    if (error.statusCode) {
      throw error;
    }
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u043F\u0430\u043F\u043A\u0438",
      folders: [],
      files: []
    };
  }
});

export { contents_get as default };
//# sourceMappingURL=contents.get.mjs.map
