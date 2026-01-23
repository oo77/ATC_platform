/**
 * API endpoint для удаления отчета группы
 * DELETE /api/groups/[groupId]/reports/[fileId]
 *
 * Доступ: только для модераторов (MANAGER) и администраторов (ADMIN)
 */

import { defineEventHandler, createError, getRouterParam } from "h3";
import { executeQuery } from "../../../../utils/db";
import { logActivity } from "../../../../utils/activityLogger";
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  // Проверка прав доступа - только модераторы и админы
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для удаления документов",
    });
  }

  const groupId = getRouterParam(event, "id");
  const fileUuid = getRouterParam(event, "fileId");

  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] Запрос на удаление файла",
  );
  console.log("  - groupId:", groupId);
  console.log("  - fileUuid:", fileUuid);
  console.log("  - user:", user.id, user.role);

  if (!groupId || !fileUuid) {
    console.error(
      "[DELETE /api/groups/[id]/reports/[fileId]] Отсутствуют параметры",
    );
    throw createError({
      statusCode: 400,
      message: "Неверные параметры запроса",
    });
  }

  // Получаем информацию о файле
  console.log("[DELETE /api/groups/[id]/reports/[fileId]] Поиск файла в БД...");
  console.log("[DELETE /api/groups/[id]/reports/[fileId]] Параметры поиска:", {
    uuid: fileUuid,
    groupId: groupId,
  });

  const files = await executeQuery<any[]>(
    `SELECT * FROM files 
     WHERE uuid = ? AND group_id = ? AND category = 'group_report' 
     LIMIT 1`,
    [fileUuid, groupId],
  );

  console.log("[DELETE /api/groups/[id]/reports/[fileId]] Результат запроса:", {
    filesFound: files.length,
    files: files,
  });

  const file = files[0];

  if (!file) {
    console.error(
      "[DELETE /api/groups/[id]/reports/[fileId]] Файл не найден в БД",
    );
    console.error("[DELETE /api/groups/[id]/reports/[fileId]] Искали:", {
      uuid: fileUuid,
      groupId: groupId,
    });
    throw createError({ statusCode: 404, message: "Файл не найден" });
  }

  console.log("[DELETE /api/groups/[id]/reports/[fileId]] Файл найден:", {
    id: file.id,
    filename: file.filename,
    storage_path: file.storage_path,
  });

  // Удаляем физический файл
  const absolutePath = path.join(process.cwd(), "storage", file.storage_path);
  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] Абсолютный путь:",
    absolutePath,
  );

  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
      console.log(
        "[DELETE /api/groups/[id]/reports/[fileId]] Физический файл удален",
      );
    } catch (error) {
      console.error(
        "[DELETE /api/groups/[id]/reports/[fileId]] Ошибка удаления физического файла:",
        error,
      );
      // Продолжаем удаление записи из БД даже если не удалось удалить файл
    }
  } else {
    console.warn(
      "[DELETE /api/groups/[id]/reports/[fileId]] Физический файл не найден, продолжаем удаление из БД",
    );
  }

  // Удаляем запись из БД
  await executeQuery(`DELETE FROM files WHERE id = ?`, [file.id]);

  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] Запись удалена из БД",
  );

  // Логируем действие
  await logActivity(
    event,
    "DELETE",
    "GROUP_REPORT",
    file.id.toString(),
    file.filename,
    {
      groupId,
      fileUuid,
    },
  );

  console.log(
    "[DELETE /api/groups/[id]/reports/[fileId]] Документ успешно удален",
  );

  return {
    success: true,
    message: "Документ успешно удален",
  };
});
