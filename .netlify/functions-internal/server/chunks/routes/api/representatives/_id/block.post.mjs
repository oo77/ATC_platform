import { d as defineEventHandler, c as createError, H as getRepresentativeById, r as readBody, N as blockRepresentative } from '../../../../nitro/nitro.mjs';
import { c as createActivityLog } from '../../../../_/activityLogRepository.mjs';
import { a as notifyRepresentativeAboutBlock } from '../../../../_/notificationService.mjs';
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

const block_post = defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const userId = event.context.user?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const existing = await getRepresentativeById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    if (existing.status === "blocked") {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u0443\u0436\u0435 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D"
      });
    }
    const body = await readBody(event);
    const reason = body?.reason;
    if (!reason || !reason.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0443 \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438"
      });
    }
    const updated = await blockRepresentative(id, userId, reason.trim());
    await createActivityLog({
      userId,
      actionType: "UPDATE",
      entityType: "REPRESENTATIVE",
      entityId: id,
      entityName: existing.fullName,
      details: {
        action: "block",
        reason: reason.trim(),
        organizationId: existing.organizationId,
        organizationName: existing.organizationName
      }
    });
    if (updated?.id) {
      notifyRepresentativeAboutBlock(updated.id, reason.trim()).catch((err) => {
        console.error("[Telegram] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0435:", err);
      });
    }
    return {
      success: true,
      data: updated,
      message: "\u041F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D"
    };
  } catch (error) {
    console.error("Error blocking representative:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0435 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F"
    });
  }
});

export { block_post as default };
//# sourceMappingURL=block.post.mjs.map
