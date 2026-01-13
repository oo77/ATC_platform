import { d as defineEventHandler, r as readBody, c as createError, A as organizationCodeExists, D as createOrganization } from '../../nitro/nitro.mjs';
import { c as createActivityLog } from '../../_/activityLogRepository.mjs';
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

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
      });
    }
    if (body.code) {
      const codeExists = await organizationCodeExists(body.code.trim());
      if (codeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
        });
      }
    }
    const organization = await createOrganization({
      code: body.code?.trim(),
      name: body.name.trim(),
      shortName: body.shortName?.trim(),
      contactPhone: body.contactPhone?.trim(),
      contactEmail: body.contactEmail?.trim(),
      address: body.address?.trim(),
      description: body.description?.trim(),
      isActive: body.isActive !== false
    });
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "CREATE",
      entityType: "ORGANIZATION",
      entityId: organization.id,
      entityName: organization.name,
      details: {
        name: organization.name,
        code: organization.code
      }
    });
    return {
      success: true,
      data: organization,
      message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0430"
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post9.mjs.map
