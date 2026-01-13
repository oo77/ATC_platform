import { d as defineEventHandler, c as createError, y as getOrganizationById, r as readBody, A as organizationCodeExists, B as updateOrganization } from '../../../nitro/nitro.mjs';
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

const _id__put = defineEventHandler(async (event) => {
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
    const body = await readBody(event);
    if (body.name !== void 0 && !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C"
      });
    }
    if (body.code !== void 0 && body.code.trim() !== existing.code) {
      const codeExists = await organizationCodeExists(body.code.trim(), id);
      if (codeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
        });
      }
    }
    const updated = await updateOrganization(id, {
      code: body.code,
      name: body.name,
      shortName: body.shortName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      address: body.address,
      description: body.description,
      isActive: body.isActive
    });
    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E"
      });
    }
    await createActivityLog({
      userId: event.context.user?.id || "system",
      actionType: "UPDATE",
      entityType: "ORGANIZATION",
      entityId: id,
      entityName: updated.name,
      details: {
        name: updated.name,
        changes: Object.keys(body).filter((k) => body[k] !== void 0)
      }
    });
    return {
      success: true,
      data: updated,
      message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430"
    };
  } catch (error) {
    console.error("Error updating organization:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
