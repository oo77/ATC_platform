import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../../../utils/auth";
import { roleHasPermission } from "../../../../../../utils/permissions";
import { Permission } from "../../../../../../types/permissions";
import * as libraryRepository from "../../../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../../../utils/db";
import { RowDataPacket } from "mysql2";

const db = getDbPool();
/**
 * POST /api/library/admin/books/[id]/access
 * Назначение доступа к книге пользователю или группе
 *
 * Требуемые права: library.manage
 *
 * Body:
 * - userId?: number - ID пользователя (если назначается индивидуально)
 * - groupId?: number - ID группы (если назначается группе)
 * - expiresAt?: string (ISO date) - дата истечения доступа
 *
 * Примечание: должен быть указан либо userId, либо groupId
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized access grant attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для назначения доступа к книгам",
    });
  }

  const bookId = event.context.params?.id;
  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "Некорректный ID книги",
    });
  }

  const body = await readBody<{
    userId?: number;
    groupId?: number;
    roleName?: string;
    expiresAt?: string;
  }>(event);

  if (!body) {
    throw createError({
      statusCode: 400,
      message: "Отсутствуют данные в запросе",
    });
  }

  console.log(
    `[Library] Access grant requested for book ${bookId} by user ${user.id} (${user.username})`,
  );

  try {
    // Проверка существования книги
    const book = await libraryRepository.getBookById(bookId);
    if (!book) {
      console.warn(`[Library] Book not found for access grant: ID ${bookId}`);
      throw createError({
        statusCode: 404,
        message: "Книга не найдена",
      });
    }

    // Валидация: должен быть указан либо userId, либо groupId, либо roleName
    if (!body.userId && !body.groupId && !body.roleName) {
      throw createError({
        statusCode: 400,
        message: "Необходимо указать userId, groupId или roleName",
      });
    }

    if (
      (body.userId && body.groupId) ||
      (body.userId && body.roleName) ||
      (body.groupId && body.roleName)
    ) {
      throw createError({
        statusCode: 400,
        message:
          "Можно указать только один тип назначения (user, group или role)",
      });
    }

    const grantedAccess: any[] = [];

    // Назначение доступа по роли (динамический доступ)
    if (body.roleName) {
      // Проверяем существующий доступ для роли
      // Мы не можем использовать checkUserBookAccess для роли легко, поэтому просто добавим запись
      // Но лучше проверить дубликаты в book_access

      const [existingRoleAccess] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM book_access WHERE book_id = ? AND role_name = ?",
        [bookId, body.roleName],
      );

      if (existingRoleAccess.length > 0) {
        throw createError({
          statusCode: 409,
          message: `Роль ${body.roleName} уже имеет доступ к этой книге`,
        });
      }

      await libraryRepository.createBookAccess({
        book_id: String(bookId),
        role_name: body.roleName,
        granted_by: String(user.id),
        expires_at: body.expiresAt ? new Date(body.expiresAt) : undefined,
      });

      grantedAccess.push({
        roleName: body.roleName,
        type: "role",
      });

      console.log(
        `[Library] Access granted to role ${body.roleName} for book ${bookId}`,
      );
    }

    // Назначение доступа индивидуальному пользователю
    if (body.userId) {
      const targetUserId = parseInt(String(body.userId));

      // Проверка существования пользователя
      const [users] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE id = ?",
        [targetUserId],
      );
      const targetUser = users[0];

      if (!targetUser) {
        throw createError({
          statusCode: 404,
          message: "Пользователь не найден",
        });
      }

      // Проверка существующего доступа
      const existingAccess = await libraryRepository.checkUserBookAccess(
        String(targetUserId),
        String(bookId),
      );
      if (existingAccess) {
        console.warn(
          `[Library] User ${targetUserId} already has access to book ${bookId}`,
        );
        throw createError({
          statusCode: 409,
          message: "Пользователь уже имеет доступ к этой книге",
        });
      }

      // Создание доступа
      await libraryRepository.createBookAccess({
        book_id: String(bookId),
        user_id: String(targetUserId),
        granted_by: String(user.id),
        expires_at: body.expiresAt ? new Date(body.expiresAt) : undefined,
      });

      grantedAccess.push({
        userId: targetUserId,
        username: targetUser.email, // Use email if username missing
        email: targetUser.email,
      });

      console.log(
        `[Library] Access granted to user ${targetUserId} (${targetUser.email}) for book ${bookId}`,
      );
    }

    // Назначение доступа группе
    if (body.groupId) {
      const groupId = parseInt(String(body.groupId));

      // Проверка существования группы
      const [groups] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM study_groups WHERE id = ?",
        [groupId],
      );
      const group = groups[0];

      if (!group) {
        throw createError({
          statusCode: 404,
          message: "Группа не найдена",
        });
      }

      // Получение всех студентов группы
      const [students] = await db.execute<RowDataPacket[]>(
        `SELECT s.user_id, u.name, u.email 
         FROM group_students gs
         JOIN students s ON gs.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE gs.group_id = ?`,
        [groupId],
      );

      if (students.length === 0) {
        console.warn(`[Library] Group ${groupId} has no students`);
        throw createError({
          statusCode: 400,
          message: "В группе нет студентов",
        });
      }

      // Назначение доступа каждому студенту
      let grantedCount = 0;
      let skippedCount = 0;

      for (const student of students) {
        // Проверка существующего доступа
        const existingAccess = await libraryRepository.checkUserBookAccess(
          String(student.user_id),
          String(bookId),
        );
        if (existingAccess) {
          skippedCount++;
          continue;
        }

        // Создание доступа
        await libraryRepository.createBookAccess({
          book_id: String(bookId),
          user_id: String(student.user_id),
          granted_by: String(user.id),
          expires_at: body.expiresAt ? new Date(body.expiresAt) : undefined,
        });

        grantedAccess.push({
          userId: student.user_id,
          username: student.email,
          email: student.email,
        });

        grantedCount++;
      }

      console.log(
        `[Library] Access granted to group ${groupId} (${group.name}) for book ${bookId}: ${grantedCount} granted, ${skippedCount} skipped (already had access)`,
      );
    }

    return {
      success: true,
      message: body.roleName
        ? `Доступ успешно назначен для роли ${body.roleName}`
        : `Доступ успешно назначен ${grantedAccess.length} пользователям`,
      granted: grantedAccess,
    };
  } catch (error: any) {
    console.error(
      `[Library] Failed to grant access for book ${bookId}:`,
      error,
    );
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: "Ошибка при назначении доступа",
    });
  }
});
