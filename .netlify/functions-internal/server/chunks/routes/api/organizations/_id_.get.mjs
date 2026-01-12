import { d as defineEventHandler, c as createError, y as getOrganizationById } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const organization = await getOrganizationById(id);
    if (!organization) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "VIEW",
      entityType: "ORGANIZATION",
      entityId: id,
      entityName: organization.name,
      details: { name: organization.name }
    });
    return {
      success: true,
      data: organization
    };
  } catch (error) {
    console.error("Error fetching organization:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
