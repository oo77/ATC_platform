import { defineEventHandler, readBody, createError } from "h3";
import { requireAuth } from "../../../../utils/auth";
import { roleHasPermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";
import * as libraryRepository from "../../../../repositories/libraryRepository";
import { getDbPool } from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

const db = getDbPool();

/**
 * POST /api/library/admin/books/bulk-access
 * Массовая выдача доступа к нескольким книгам
 *
 * Требуемые права: library.manage
 *
 * Body:
 * - bookIds: string[] - массив ID книг
 * - type: "user" | "group" | "role" - тип доступа
 * - userId?: string - ID пользователя
 * - groupId?: number - ID группы
 * - roleName?: string - название роли
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event);

  // Проверка прав доступа
  if (!roleHasPermission(user.role, Permission.LIBRARY_MANAGE)) {
    console.error(
      `[Library] Unauthorized bulk access grant attempt by user ${user.id} (${user.role})`,
    );
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для назначения доступа к книгам",
    });
  }

  const body = await readBody<{
    bookIds: string[];
    type: "user" | "group" | "role";
    userId?: string;
    groupId?: number;
    roleName?: string;
  }>(event);

  if (!body || !body.bookIds || body.bookIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Не указаны книги для назначения доступа",
    });
  }

  if (!body.type) {
    throw createError({
      statusCode: 400,
      message: "Необходимо указать тип доступа (user, group или role)",
    });
  }

  if (!body.userId && !body.groupId && !body.roleName) {
    throw createError({
      statusCode: 400,
      message: "Необходимо указать userId, groupId или roleName",
    });
  }

  console.log(
    `[Library] Bulk access grant requested by user ${user.id} (${user.username}): type=${body.type}, books=${body.bookIds.length}`,
  );

  const results: {
    bookId: string;
    bookTitle: string;
    success: boolean;
    message: string;
    grantedCount?: number;
    skippedCount?: number;
  }[] = [];

  for (const bookId of body.bookIds) {
    try {
      // Проверка существования книги
      const book = await libraryRepository.getBookById(bookId);
      if (!book) {
        results.push({
          bookId,
          bookTitle: bookId,
          success: false,
          message: "Книга не найдена",
        });
        continue;
      }

      let grantedCount = 0;
      let skippedCount = 0;

      if (body.roleName) {
        // Доступ по роли
        const [existingRoleAccess] = await db.execute<RowDataPacket[]>(
          "SELECT id FROM book_access WHERE book_id = ? AND role_name = ?",
          [bookId, body.roleName],
        );

        if (existingRoleAccess.length > 0) {
          skippedCount++;
        } else {
          await libraryRepository.createBookAccess({
            book_id: String(bookId),
            role_name: body.roleName,
            granted_by: String(user.id),
          });
          grantedCount++;
        }

        console.log(
          `[Library] Bulk: Role access for book ${bookId} (title: ${book.title}): granted=${grantedCount}, skipped=${skippedCount}`,
        );
      } else if (body.userId) {
        // Доступ конкретному пользователю
        const targetUserId = String(body.userId);
        const existingAccess = await libraryRepository.checkUserBookAccess(
          targetUserId,
          String(bookId),
        );

        if (existingAccess) {
          skippedCount++;
        } else {
          await libraryRepository.createBookAccess({
            book_id: String(bookId),
            user_id: targetUserId,
            granted_by: String(user.id),
          });
          grantedCount++;
        }

        console.log(
          `[Library] Bulk: User access for book ${bookId} (title: ${book.title}): granted=${grantedCount}, skipped=${skippedCount}`,
        );
      } else if (body.groupId) {
        // Доступ группе
        const groupId = parseInt(String(body.groupId));

        const [groups] = await db.execute<RowDataPacket[]>(
          "SELECT * FROM study_groups WHERE id = ?",
          [groupId],
        );
        const group = groups[0];

        if (!group) {
          results.push({
            bookId,
            bookTitle: book.title,
            success: false,
            message: "Группа не найдена",
          });
          continue;
        }

        const [students] = await db.execute<RowDataPacket[]>(
          `SELECT s.user_id, u.name, u.email 
           FROM group_students gs
           JOIN students s ON gs.student_id = s.id
           JOIN users u ON s.user_id = u.id
           WHERE gs.group_id = ?`,
          [groupId],
        );

        if (students.length === 0) {
          results.push({
            bookId,
            bookTitle: book.title,
            success: false,
            message: "В группе нет студентов",
          });
          continue;
        }

        for (const student of students) {
          const existingAccess = await libraryRepository.checkUserBookAccess(
            String(student.user_id),
            String(bookId),
          );
          if (existingAccess) {
            skippedCount++;
            continue;
          }

          await libraryRepository.createBookAccess({
            book_id: String(bookId),
            user_id: String(student.user_id),
            granted_by: String(user.id),
          });
          grantedCount++;
        }

        console.log(
          `[Library] Bulk: Group access for book ${bookId} (title: ${book.title}): granted=${grantedCount}, skipped=${skippedCount}`,
        );
      }

      results.push({
        bookId,
        bookTitle: book.title,
        success: true,
        message:
          grantedCount > 0
            ? `Доступ выдан (${grantedCount})`
            : "Уже имеют доступ",
        grantedCount,
        skippedCount,
      });
    } catch (error: any) {
      console.error(
        `[Library] Bulk access failed for book ${bookId}:`,
        error.message,
      );
      results.push({
        bookId,
        bookTitle: bookId,
        success: false,
        message: error.message || "Ошибка при назначении доступа",
      });
    }
  }

  const totalGranted = results.reduce((sum, r) => sum + (r.grantedCount || 0), 0);
  const totalSkipped = results.reduce((sum, r) => sum + (r.skippedCount || 0), 0);
  const successCount = results.filter((r) => r.success).length;

  console.log(
    `[Library] Bulk access completed: ${successCount}/${body.bookIds.length} books processed, ${totalGranted} granted, ${totalSkipped} skipped`,
  );

  return {
    success: true,
    message: `Обновлено книг: ${successCount} из ${body.bookIds.length}. Выдано доступов: ${totalGranted}. Пропущено: ${totalSkipped}.`,
    results,
    totalGranted,
    totalSkipped,
    successCount,
  };
});
