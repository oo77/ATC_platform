import { g as defineEventHandler, h as createError, r as readBody } from '../../../../_/nitro.mjs';
import { g as getGroupById, u as updateGroup } from '../../../../_/groupRepository.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
import { b as getPermissionContext } from '../../../../_/permissions.mjs';
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
import '../../../../_/activityLogRepository.mjs';

const archive_put = defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  const context = await getPermissionContext(event);
  if (!context) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (context.role !== "ADMIN" && context.role !== "MANAGER") {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0430\u0440\u0445\u0438\u0432\u0430\u0446\u0438\u0438 \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
  const body = await readBody(event);
  const { isArchived } = body;
  if (typeof isArchived !== "boolean") {
    throw createError({
      statusCode: 400,
      message: "\u041F\u043E\u043B\u0435 isArchived (boolean) \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
    });
  }
  const group = await getGroupById(id);
  if (!group) {
    throw createError({
      statusCode: 404,
      message: "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
    });
  }
  const now = /* @__PURE__ */ new Date();
  const updatedGroup = await updateGroup(id, {
    isArchived,
    isActive: !isArchived,
    archivedAt: isArchived ? now : null,
    // Если восстанавливаем, то null
    archivedBy: isArchived ? context.userId : null
  });
  await logActivity(event, "UPDATE", "GROUP", id, group.code, {
    action: isArchived ? "archive" : "restore",
    previousStatus: group.isArchived,
    newStatus: isArchived
  });
  return {
    success: true,
    message: isArchived ? "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0435\u043D\u0430 \u0432 \u0430\u0440\u0445\u0438\u0432" : "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u0438\u0437 \u0430\u0440\u0445\u0438\u0432\u0430",
    group: updatedGroup
  };
});

export { archive_put as default };
//# sourceMappingURL=archive.put.mjs.map
