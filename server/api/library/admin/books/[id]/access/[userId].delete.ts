import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import { roleHasPermission } from "../../../../../../utils/permissions";
import { Permission } from "../../../../../../types/permissions";
import * as libraryRepository from "../../../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../../../utils/db";

const db = getDbPool();

/**
 * DELETE /api/library/admin/books/[id]/access/[userId]
 * Отзыв доступа к книге у пользователя
 *
 * Требуемые права: library.manage
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized access revoke attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для отзыва доступа",
    });
  }

  const bookId = event.context.params?.id;
  const targetUserId = event.context.params?.userId;

  if (!bookId || !targetUserId) {
    throw createError({
      statusCode: 400,
      message: "Некорректные параметры",
    });
  }

  console.log(
    `[Library] Access revoke requested for book ${bookId}, user ${targetUserId} by admin ${user.id} (${user.username})`,
  );

  try {
    // Проверка существования книги
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Проверка существования пользователя
    const [users] = await db.execute<any[]>(
      "SELECT * FROM users WHERE id = ?",
      [targetUserId],
    );
    const targetUser = users[0];
    if (!targetUser) {
      console.warn(`[Library] User not found: ID ${targetUserId}`);
      throw createError({
        statusCode: 404,
        message: "Пользователь не найден",
      });
    }

    // Проверка существования доступа
    const access = await libraryRepository.checkUserBookAccess(
      String(targetUserId),
      String(bookId),
    );
    if (!access) {
      console.warn(
        `[Library] Access not found for user ${targetUserId} to book ${bookId}`,
      );
      throw createError({
        statusCode: 404,
        message: "Доступ не найден",
      });
    }

    // Проверка активной сессии чтения
    const [sessions] = await db.execute<any[]>(
      "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
      [bookId, targetUserId],
    );
    const activeSession = sessions[0];

    if (activeSession) {
      console.warn(
        `[Library] Cannot revoke access: user ${targetUserId} has active reading session for book ${bookId}`,
      );
      throw createError({
        statusCode: 409,
        message:
          "Невозможно отозвать доступ: пользователь сейчас читает эту книгу. Дождитесь завершения сессии.",
      });
    }

    // Отзыв доступа
    await db.execute(
      "DELETE FROM book_access WHERE user_id = ? AND book_id = ?",
      [targetUserId, bookId],
    );

    console.log(
      `[Library] Access revoked for user ${targetUserId} (${targetUser.username}) to book ${bookId} ("${book.title}") by admin ${user.id}`,
    );

    return {
      success: true,
      message: "Доступ успешно отозван",
      revokedAccess: {
        userId: targetUserId,
        username: targetUser.username,
        bookId: bookId,
        bookTitle: book.title,
      },
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to revoke access for user ${targetUserId} to book ${bookId}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при отзыве доступа",
    });
  }
});
