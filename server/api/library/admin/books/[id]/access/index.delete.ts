import { defineEventHandler, createError, getQuery, readBody } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import { roleHasPermission } from "../../../../../../utils/permissions";
import { Permission } from "../../../../../../types/permissions";
import { getDbPool } from "../../../../../../utils/db";

const db = getDbPool();

/**
 * DELETE /api/library/admin/books/[id]/access
 * Отзыв доступа к книге по ID записи доступа
 *
 * Требуемые права: library.manage
 *
 * Query or Body:
 * - accessId: number
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для отзыва доступа",
    });
  }

  const bookId = event.context.params?.id;

  // Try to get accessId from query or body
  const query = getQuery(event);
  let accessId = query.accessId;

  if (!accessId) {
    const body = await readBody(event).catch(() => ({}));
    accessId = body?.accessId;
  }

  if (!bookId || !accessId) {
    throw createError({
      statusCode: 400,
      message: "Некорректные параметры (требуется bookId и accessId)",
    });
  }

  console.log(
    `[Library] Access delete requested for access ID ${accessId} on book ${bookId} by admin ${user.id}`,
  );

  try {
    // Получаем информацию о доступе перед удалением для логов
    const [accesses] = await db.execute<any[]>(
      "SELECT * FROM book_access WHERE id = ? AND book_id = ?",
      [accessId, bookId],
    );

    const access = accesses[0];
    if (!access) {
      throw createError({
        statusCode: 404,
        message: "Запись доступа не найдена",
      });
    }

    // Если это доступ пользователя, проверяем активную сессию
    if (access.user_id) {
      const [sessions] = await db.execute<any[]>(
        "SELECT * FROM book_reading_sessions WHERE book_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
        [bookId, access.user_id],
      );

      if (sessions.length > 0) {
        throw createError({
          statusCode: 409,
          message:
            "Невозможно отозвать доступ: пользователь сейчас читает эту книгу.",
        });
      }
    }

    // Удаление
    await db.execute("DELETE FROM book_access WHERE id = ?", [accessId]);

    console.log(
      `[Library] Access ID ${accessId} deleted (User: ${access.user_id}, Role: ${access.role_name})`,
    );

    return {
      success: true,
      message: "Доступ успешно отозван",
    };
  } catch (error: any) {
    console.error(`[Library] Failed to delete access ${accessId}:`, error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при отзыве доступа",
    });
  }
});
