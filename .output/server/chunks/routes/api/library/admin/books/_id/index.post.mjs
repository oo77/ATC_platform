import { g as defineEventHandler, G as requireAuth, h as createError, r as readBody, w as getDbPool } from '../../../../../../_/nitro.mjs';
import { c as roleHasPermission, P as Permission } from '../../../../../../_/permissions.mjs';
import { g as getBookById, a as createBookAccess, c as checkUserBookAccess } from '../../../../../../_/libraryRepository.mjs';
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
const index_post = defineEventHandler(async (event) => {
  const user = requireAuth(event);
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized access grant attempt by user ${user.id} (${user.role})`
    );
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043A\u043D\u0438\u0433\u0430\u043C"
    });
  }
  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 ID \u043A\u043D\u0438\u0433\u0438"
    });
  }
  const body = await readBody(event);
  if (!body) {
    throw createError({
      statusCode: 400,
      message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
    });
  }
  console.log(
    `[Library] Access grant requested for book ${bookId} by user ${user.id} (${user.username})`
  );
  try {
    const book = await getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found for access grant: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "\u041A\u043D\u0438\u0433\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    if (!body.userId && !body.groupId && !body.roleName) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C userId, groupId \u0438\u043B\u0438 roleName"
      });
    }
    if (body.userId && body.groupId || body.userId && body.roleName || body.groupId && body.roleName) {
      throw createError({
        statusCode: 400,
        message: "\u041C\u043E\u0436\u043D\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0434\u0438\u043D \u0442\u0438\u043F \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F (user, group \u0438\u043B\u0438 role)"
      });
    }
    const grantedAccess = [];
    if (body.roleName) {
      const [existingRoleAccess] = await db.execute(
        "SELECT id FROM book_access WHERE book_id = ? AND role_name = ?",
        [bookId, body.roleName]
      );
      if (existingRoleAccess.length > 0) {
        throw createError({
          statusCode: 409,
          message: `\u0420\u043E\u043B\u044C ${body.roleName} \u0443\u0436\u0435 \u0438\u043C\u0435\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u044D\u0442\u043E\u0439 \u043A\u043D\u0438\u0433\u0435`
        });
      }
      await createBookAccess({
        book_id: String(bookId),
        role_name: body.roleName,
        granted_by: String(user.id),
        expires_at: body.expiresAt ? new Date(body.expiresAt) : void 0
      });
      grantedAccess.push({
        roleName: body.roleName,
        type: "role"
      });
      console.log(
        `[Library] Access granted to role ${body.roleName} for book ${bookId}`
      );
    }
    if (body.userId) {
      const targetUserId = parseInt(String(body.userId));
      const [users] = await db.execute(
        "SELECT * FROM users WHERE id = ?",
        [targetUserId]
      );
      const targetUser = users[0];
      if (!targetUser) {
        throw createError({
          statusCode: 404,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
        });
      }
      const existingAccess = await checkUserBookAccess(
        String(targetUserId),
        String(bookId)
      );
      if (existingAccess) {
        console.warn(
          `[Library] User ${targetUserId} already has access to book ${bookId}`
        );
        throw createError({
          statusCode: 409,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0443\u0436\u0435 \u0438\u043C\u0435\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u044D\u0442\u043E\u0439 \u043A\u043D\u0438\u0433\u0435"
        });
      }
      await createBookAccess({
        book_id: String(bookId),
        user_id: String(targetUserId),
        granted_by: String(user.id),
        expires_at: body.expiresAt ? new Date(body.expiresAt) : void 0
      });
      grantedAccess.push({
        userId: targetUserId,
        username: targetUser.email,
        // Use email if username missing
        email: targetUser.email
      });
      console.log(
        `[Library] Access granted to user ${targetUserId} (${targetUser.email}) for book ${bookId}`
      );
    }
    if (body.groupId) {
      const groupId = parseInt(String(body.groupId));
      const [groups] = await db.execute(
        "SELECT * FROM study_groups WHERE id = ?",
        [groupId]
      );
      const group = groups[0];
      if (!group) {
        throw createError({
          statusCode: 404,
          message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        });
      }
      const [students] = await db.execute(
        `SELECT s.user_id, u.name, u.email 
         FROM group_students gs
         JOIN students s ON gs.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE gs.group_id = ?`,
        [groupId]
      );
      if (students.length === 0) {
        console.warn(`[Library] Group ${groupId} has no students`);
        throw createError({
          statusCode: 400,
          message: "\u0412 \u0433\u0440\u0443\u043F\u043F\u0435 \u043D\u0435\u0442 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432"
        });
      }
      let grantedCount = 0;
      let skippedCount = 0;
      for (const student of students) {
        const existingAccess = await checkUserBookAccess(
          String(student.user_id),
          String(bookId)
        );
        if (existingAccess) {
          skippedCount++;
          continue;
        }
        await createBookAccess({
          book_id: String(bookId),
          user_id: String(student.user_id),
          granted_by: String(user.id),
          expires_at: body.expiresAt ? new Date(body.expiresAt) : void 0
        });
        grantedAccess.push({
          userId: student.user_id,
          username: student.email,
          email: student.email
        });
        grantedCount++;
      }
      console.log(
        `[Library] Access granted to group ${groupId} (${group.name}) for book ${bookId}: ${grantedCount} granted, ${skippedCount} skipped (already had access)`
      );
    }
    return {
      success: true,
      message: body.roleName ? `\u0414\u043E\u0441\u0442\u0443\u043F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u0434\u043B\u044F \u0440\u043E\u043B\u0438 ${body.roleName}` : `\u0414\u043E\u0441\u0442\u0443\u043F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D ${grantedAccess.length} \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C`,
      granted: grantedAccess
    };
  } catch (error) {
    console.error(
      `[Library] Failed to grant access for book ${bookId}:`,
      error
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u0430"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
