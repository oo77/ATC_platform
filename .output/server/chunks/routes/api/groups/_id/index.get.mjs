import { g as defineEventHandler, h as createError, j as getRouterParam, f as executeQuery } from '../../../../_/nitro.mjs';
import { g as getGroupById } from '../../../../_/groupRepository.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const index_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  const groupId = getRouterParam(event, "id");
  if (!groupId) {
    throw createError({ statusCode: 400, message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D" });
  }
  if (user.role === "STUDENT") {
    throw createError({
      statusCode: 403,
      message: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043E\u0442\u0447\u0435\u0442\u0430\u043C \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
  const group = await getGroupById(groupId);
  if (!group) {
    throw createError({ statusCode: 404, message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
  }
  try {
    const files = await executeQuery(
      `SELECT 
         id, uuid, filename, size_bytes, extension, uploaded_at_time,
         uploaded_by_user
       FROM files 
       WHERE group_id = ? AND category = 'group_report'
       ORDER BY uploaded_at_time DESC`,
      [groupId]
    );
    console.log(
      `[GET /api/groups/${groupId}/reports] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0444\u0430\u0439\u043B\u043E\u0432:`,
      files.length
    );
    return {
      success: true,
      files: files.map((f) => ({
        id: f.id,
        // ID в БД
        uuid: f.uuid,
        // Публичный UUID
        name: f.filename,
        size: f.size_bytes,
        extension: f.extension,
        uploadedAt: f.uploaded_at_time,
        uploadedBy: f.uploaded_by_user,
        url: `/api/groups/${groupId}/reports/${f.uuid}`
        // Ссылка на скачивание (используем uuid)
      }))
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u043E\u0442\u0447\u0435\u0442\u043E\u0432:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u043E\u0442\u0447\u0435\u0442\u043E\u0432"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
