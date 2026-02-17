import { g as defineEventHandler, h as createError, j as getRouterParam, f as executeQuery, I as sendStream } from '../../../../../_/nitro.mjs';
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

const _fileId__get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (user.role === "STUDENT") {
    throw createError({ statusCode: 403, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430" });
  }
  const groupId = getRouterParam(event, "id");
  const fileUuid = getRouterParam(event, "fileId");
  console.log(
    "[GET /api/groups/[id]/reports/[fileId]] \u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0444\u0430\u0439\u043B\u0430"
  );
  console.log("  - groupId:", groupId);
  console.log("  - fileUuid:", fileUuid);
  console.log("  - URL:", event.node.req.url);
  if (!groupId || !fileUuid) {
    console.error(
      "[GET /api/groups/[id]/reports/[fileId]] \u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B"
    );
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u0430"
    });
  }
  console.log("[GET /api/groups/[id]/reports/[fileId]] \u041F\u043E\u0438\u0441\u043A \u0444\u0430\u0439\u043B\u0430 \u0432 \u0411\u0414...");
  const files = await executeQuery(
    `SELECT * FROM files 
     WHERE uuid = ? AND group_id = ? AND category = 'group_report' 
     LIMIT 1`,
    [fileUuid, groupId]
  );
  console.log(
    "[GET /api/groups/[id]/reports/[fileId]] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0444\u0430\u0439\u043B\u043E\u0432:",
    files.length
  );
  const file = files[0];
  if (!file) {
    console.error(
      "[GET /api/groups/[id]/reports/[fileId]] \u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0411\u0414"
    );
    throw createError({ statusCode: 404, message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  console.log("[GET /api/groups/[id]/reports/[fileId]] \u0424\u0430\u0439\u043B \u043D\u0430\u0439\u0434\u0435\u043D:", {
    id: file.id,
    filename: file.filename,
    storage_path: file.storage_path
  });
  const absolutePath = path__default.join(process.cwd(), "storage", file.storage_path);
  console.log(
    "[GET /api/groups/[id]/reports/[fileId]] \u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0439 \u043F\u0443\u0442\u044C:",
    absolutePath
  );
  if (!fs__default.existsSync(absolutePath)) {
    console.error(
      "[GET /api/groups/[id]/reports/[fileId]] \u0424\u0430\u0439\u043B \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442"
    );
    throw createError({
      statusCode: 404,
      message: "\u0424\u0430\u0439\u043B \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435"
    });
  }
  console.log("[GET /api/groups/[id]/reports/[fileId]] \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0444\u0430\u0439\u043B\u0430...");
  const stream = fs__default.createReadStream(absolutePath);
  event.node.res.setHeader("Content-Type", "application/pdf");
  event.node.res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(
      file.filename || "report.pdf"
    )}"`
  );
  return sendStream(event, stream);
});

export { _fileId__get as default };
//# sourceMappingURL=_fileId_.get.mjs.map
