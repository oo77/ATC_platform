/**
 * API endpoint для удаления учебной группы
 * DELETE /api/groups/[id]
 */

import { defineEventHandler, createError, getRouterParam } from "h3";
import { deleteGroup, getGroupById } from "../../repositories/groupRepository";
import { logActivity } from "../../utils/activityLogger";
import {
  getGroupReportFiles,
  deleteGroupReportFile,
} from "../../utils/groupFileStorage";
import { executeQuery } from "../../utils/db";

export default defineEventHandler(async (event) => {
  // 1. Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // 2. Проверка прав (Только ADMIN)
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      message:
        "Только администратор может удалять группы. Для скрытия группы используйте архивацию.",
    });
  }

  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({ statusCode: 400, message: "ID группы не указан" });
    }

    // 3. Проверка существования
    const group = await getGroupById(id);
    if (!group) {
      throw createError({ statusCode: 404, message: "Группа не найдена" });
    }

    const groupCode = group.code;

    // 4. Очистка файлов отчетов
    // Удаляем записи из таблицы files (чтобы избежать FK ошибок, если есть, или просто для чистоты)
    await executeQuery(
      "DELETE FROM files WHERE group_id = ? AND category = ?",
      [id, "group_report"]
    );

    // Удаляем физические файлы
    try {
      const files = await getGroupReportFiles(id);
      for (const file of files) {
        await deleteGroupReportFile(file);
      }
      // Можно было бы удалить и саму директорию, но утилита deleteGroupReportFile удаляет только файлы.
      // Оставим директорию пустой, это не критично.
    } catch (e) {
      console.warn("Ошибка при очистке файлов группы:", e);
      // Не прерываем удаление группы из-за ошибки удаления файлов
    }

    // 5. Удаляем группу
    const deleted = await deleteGroup(id);

    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: "Не удалось удалить группу",
      });
    }

    // 6. Логируем действие
    await logActivity(event, "DELETE", "GROUP", id, groupCode, {
      studentsCount: group.students?.length || 0,
    });

    return {
      success: true,
      message: "Группа и связанные данные успешно удалены",
    };
  } catch (error: any) {
    console.error("Ошибка удаления группы:", error);
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 500,
      message: "Ошибка при удалении группы",
    });
  }
});
