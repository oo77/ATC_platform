import { d as defineEventHandler, c as createError, y as getOrganizationById, z as deleteOrganization } from '../../../nitro/nitro.mjs';
import { c as createActivityLog } from '../../../_/activityLogRepository.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const existing = await getOrganizationById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    try {
      await deleteOrganization(id);
    } catch (error) {
      if (error.message?.includes("\u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438")) {
        throw createError({
          statusCode: 400,
          statusMessage: error.message
        });
      }
      throw error;
    }
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "DELETE",
      entityType: "ORGANIZATION",
      entityId: id,
      entityName: existing.name,
      details: {
        name: existing.name,
        code: existing.code
      }
    });
    return {
      success: true,
      message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
