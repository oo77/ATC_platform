import { g as defineEventHandler, h as createError, r as readBody, f as executeQuery, k as executeTransaction } from '../../../_/nitro.mjs';
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

const bulkDelete_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0433\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F"
    });
  }
  const body = await readBody(event);
  const { eventIds } = body;
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u0435"
    });
  }
  console.log(
    `[bulk-delete] User ${user.id} deleting ${eventIds.length} events`
  );
  try {
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT id, title, group_id
      FROM schedule_events
      WHERE id IN (${placeholders})
    `;
    const eventsToDelete = await executeQuery(
      eventsQuery,
      eventIds
    );
    if (eventsToDelete.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0417\u0430\u043D\u044F\u0442\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B"
      });
    }
    const deletedIds = [];
    const errors = [];
    await executeTransaction(async (connection) => {
      const deleteQuery = `DELETE FROM schedule_events WHERE id IN (${placeholders})`;
      const [result] = await connection.query(deleteQuery, eventIds);
      const affectedRows = result.affectedRows || 0;
      for (const evt of eventsToDelete) {
        deletedIds.push(evt.id);
      }
    });
    await logActivity(
      event,
      "DELETE",
      "SCHEDULE",
      deletedIds[0] || void 0,
      `\u041C\u0430\u0441\u0441\u043E\u0432\u043E\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 ${deletedIds.length} \u0437\u0430\u043D\u044F\u0442\u0438\u0439`,
      {
        deletedEventIds: deletedIds,
        deletedEventTitles: eventsToDelete.map((e) => e.title)
      }
    );
    console.log(
      `[bulk-delete] Successfully deleted ${deletedIds.length} events`
    );
    return {
      success: true,
      deletedCount: deletedIds.length,
      errors
    };
  } catch (error) {
    console.error("[bulk-delete] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0433\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F"
    });
  }
});

export { bulkDelete_post as default };
//# sourceMappingURL=bulk-delete.post.mjs.map
