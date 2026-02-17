import { g as defineEventHandler, h as createError, r as readBody } from '../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const logDownload_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  const body = await readBody(event);
  const { reportType, format, groupCode, groupId, disciplineName } = body;
  if (!reportType || !format) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u0442\u0438\u043F \u043E\u0442\u0447\u0451\u0442\u0430 \u0438\u043B\u0438 \u0444\u043E\u0440\u043C\u0430\u0442"
    });
  }
  const reportNames = {
    empty_journal: "\u041F\u0443\u0441\u0442\u043E\u0439 \u0436\u0443\u0440\u043D\u0430\u043B",
    group_report: "\u0417\u0430\u0447\u0451\u0442\u043D\u0430\u044F \u0432\u0435\u0434\u043E\u043C\u043E\u0441\u0442\u044C",
    certificate_report: "\u0412\u0435\u0434\u043E\u043C\u043E\u0441\u0442\u044C \u0432\u044B\u0434\u0430\u0447\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432"
  };
  const reportName = reportNames[reportType] || reportType;
  const entityName = `${reportName} (${format.toUpperCase()})`;
  await logActivity(
    event,
    "DOWNLOAD",
    "GROUP_REPORT",
    groupId || void 0,
    entityName,
    {
      reportType,
      format,
      groupCode,
      disciplineName,
      downloadedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  );
  return {
    success: true,
    message: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E \u0432 \u0436\u0443\u0440\u043D\u0430\u043B"
  };
});

export { logDownload_post as default };
//# sourceMappingURL=log-download.post.mjs.map
