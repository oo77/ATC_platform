import { g as defineEventHandler, h as createError, j as getRouterParam, f as executeQuery } from '../../../../../_/nitro.mjs';
import { l as logActivity } from '../../../../../_/activityLogger.mjs';
import fs__default from 'fs';
import path__default from 'path';
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
import '../../../../../_/activityLogRepository.mjs';

const _fileId__delete = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432"
    });
  }
  const groupId = getRouterParam(event, "id");
  const fileUuid = getRouterParam(event, "fileId");
  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] \u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0444\u0430\u0439\u043B\u0430"
  );
  console.log("  - groupId:", groupId);
  console.log("  - fileUuid:", fileUuid);
  console.log("  - user:", user.id, user.role);
  if (!groupId || !fileUuid) {
    console.error(
      "[DELETE /api/groups/[id]/reports/[fileId]] \u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B"
    );
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u0430"
    });
  }
  console.log("[DELETE /api/groups/[id]/reports/[fileId]] \u041F\u043E\u0438\u0441\u043A \u0444\u0430\u0439\u043B\u0430 \u0432 \u0411\u0414...");
  console.log("[DELETE /api/groups/[id]/reports/[fileId]] \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043F\u043E\u0438\u0441\u043A\u0430:", {
    uuid: fileUuid,
    groupId
  });
  const files = await executeQuery(
    `SELECT * FROM files 
     WHERE uuid = ? AND group_id = ? AND category = 'group_report' 
     LIMIT 1`,
    [fileUuid, groupId]
  );
  console.log("[DELETE /api/groups/[id]/reports/[fileId]] \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0430:", {
    filesFound: files.length,
    files
  });
  const file = files[0];
  if (!file) {
    console.error(
      "[DELETE /api/groups/[id]/reports/[fileId]] \u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0411\u0414"
    );
    console.error("[DELETE /api/groups/[id]/reports/[fileId]] \u0418\u0441\u043A\u0430\u043B\u0438:", {
      uuid: fileUuid,
      groupId
    });
    throw createError({ statusCode: 404, message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  console.log("[DELETE /api/groups/[id]/reports/[fileId]] \u0424\u0430\u0439\u043B \u043D\u0430\u0439\u0434\u0435\u043D:", {
    id: file.id,
    filename: file.filename,
    storage_path: file.storage_path
  });
  const absolutePath = path__default.join(process.cwd(), "storage", file.storage_path);
  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] \u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0439 \u043F\u0443\u0442\u044C:",
    absolutePath
  );
  if (fs__default.existsSync(absolutePath)) {
    try {
      fs__default.unlinkSync(absolutePath);
      console.log(
        "[DELETE /api/groups/[id]/reports/[fileId]] \u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0444\u0430\u0439\u043B \u0443\u0434\u0430\u043B\u0435\u043D"
      );
    } catch (error) {
      console.error(
        "[DELETE /api/groups/[id]/reports/[fileId]] \u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430:",
        error
      );
    }
  } else {
    console.warn(
      "[DELETE /api/groups/[id]/reports/[fileId]] \u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0444\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D, \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u043C \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0438\u0437 \u0411\u0414"
    );
  }
  await executeQuery(`DELETE FROM files WHERE id = ?`, [file.id]);
  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] \u0417\u0430\u043F\u0438\u0441\u044C \u0443\u0434\u0430\u043B\u0435\u043D\u0430 \u0438\u0437 \u0411\u0414"
  );
  await logActivity(
    event,
    "DELETE",
    "GROUP_REPORT",
    file.id.toString(),
    file.filename,
    {
      groupId,
      fileUuid
    }
  );
  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D"
  );
  return {
    success: true,
    message: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D"
  };
});

export { _fileId__delete as default };
//# sourceMappingURL=_fileId_.delete.mjs.map
