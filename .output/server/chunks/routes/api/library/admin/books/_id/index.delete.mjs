import { g as defineEventHandler, G as requireAuth, h as createError, i as getQuery, r as readBody, w as getDbPool } from '../../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../../_/permissions.mjs';
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

const db = getDbPool();
const index_delete = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043E\u0442\u0437\u044B\u0432\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
  const bookId = event.context.params?.id;
  const query = getQuery(event);
  let accessId = query.accessId;
  if (!accessId) {
    const body = await readBody(event).catch(() => ({}));
    accessId = body?.accessId;
  }
  if (!bookId || !accessId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B (\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F bookId \u0438 accessId)"
    });
  }
  console.log(
    `[Library] Access delete requested for access ID ${accessId} on book ${bookId} by admin ${user.id}`
  );
  try {
    const [accesses] = await db.execute(
      "SELECT * FROM book_access WHERE id = ? AND book_id = ?",
      [accessId, bookId]
    );
    const access = accesses[0];
    if (!access) {
      throw createError({
        statusCode: 404,
        message: "\u0417\u0430\u043F\u0438\u0441\u044C \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (access.user_id) {
      const [sessions] = await db.execute(
        "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
        [bookId, access.user_id]
      );
      if (sessions.length > 0) {
        throw createError({
          statusCode: 409,
          message: "\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F: \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441\u0435\u0439\u0447\u0430\u0441 \u0447\u0438\u0442\u0430\u0435\u0442 \u044D\u0442\u0443 \u043A\u043D\u0438\u0433\u0443."
        });
      }
    }
    await db.execute("DELETE FROM book_access WHERE id = ?", [accessId]);
    console.log(
      `[Library] Access ID ${accessId} deleted (User: ${access.user_id}, Role: ${access.role_name})`
    );
    return {
      success: true,
      message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043E\u0437\u0432\u0430\u043D"
    };
  } catch (error) {
    console.error(`[Library] Failed to delete access ${accessId}:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0442\u0437\u044B\u0432\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
});

export { index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
