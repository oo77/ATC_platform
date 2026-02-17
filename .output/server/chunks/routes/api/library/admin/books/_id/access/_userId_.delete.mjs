import { g as defineEventHandler, G as requireAuth, h as createError, w as getDbPool } from '../../../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../../../_/permissions.mjs';
import { g as getBookById, c as checkUserBookAccess } from '../../../../../../../_/libraryRepository.mjs';
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
const _userId__delete = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized access revoke attempt by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043E\u0442\u0437\u044B\u0432\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
  const bookId = event.context.params?.id;
  const targetUserId = event.context.params?.userId;
  if (!bookId || !targetUserId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B"
    });
  }
  console.log(
    `[Library] Access revoke requested for book ${bookId}, user ${targetUserId} by admin ${user.id} (${user.username})`
  );
  try {
    const book = await getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const [users] = await db.execute(
      "SELECT * FROM users WHERE id = ?",
      [targetUserId]
    );
    const targetUser = users[0];
    if (!targetUser) {
      console.warn(`[Library] User not found: ID ${targetUserId}`);
      throw createError({
        statusCode: 404,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const access = await checkUserBookAccess(
      String(targetUserId),
      String(bookId)
    );
    if (!access) {
      console.warn(
        `[Library] Access not found for user ${targetUserId} to book ${bookId}`
      );
      throw createError({
        statusCode: 404,
        message: "\u0414\u043E\u0441\u0442\u0443\u043F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const [sessions] = await db.execute(
      "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
      [bookId, targetUserId]
    );
    const activeSession = sessions[0];
    if (activeSession) {
      console.warn(
        `[Library] Cannot revoke access: user ${targetUserId} has active reading session for book ${bookId}`
      );
      throw createError({
        statusCode: 409,
        message: "\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F: \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441\u0435\u0439\u0447\u0430\u0441 \u0447\u0438\u0442\u0430\u0435\u0442 \u044D\u0442\u0443 \u043A\u043D\u0438\u0433\u0443. \u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u0441\u0435\u0441\u0441\u0438\u0438."
      });
    }
    await db.execute(
      "DELETE FROM book_access WHERE user_id = ? AND book_id = ?",
      [targetUserId, bookId]
    );
    console.log(
      `[Library] Access revoked for user ${targetUserId} (${targetUser.username}) to book ${bookId} ("${book.title}") by admin ${user.id}`
    );
    return {
      success: true,
      message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043E\u0437\u0432\u0430\u043D",
      revokedAccess: {
        userId: targetUserId,
        username: targetUser.username,
        bookId,
        bookTitle: book.title
      }
    };
  } catch (error) {
    console.error(
      `[Library] Failed to revoke access for user ${targetUserId} to book ${bookId}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0442\u0437\u044B\u0432\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
});

export { _userId__delete as default };
//# sourceMappingURL=_userId_.delete.mjs.map
