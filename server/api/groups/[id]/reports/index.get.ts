/**
 * API endpoint для получения списка отчетов группы
 * GET /api/groups/[id]/reports
 */

import { defineEventHandler, createError, getRouterParam } from "h3";
import { executeQuery } from "../../../../utils/db";
import { getGroupById } from "../../../../repositories/groupRepository";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Требуется авторизация" });
  }

  const groupId = getRouterParam(event, "id");
  if (!groupId) {
    throw createError({ statusCode: 400, message: "ID группы не указан" });
  }

  // Проверяем доступ к группе
  // Админ, Модератор - полный доступ
  // Инструктор - только если ведет занятия (пока упростим: инструкторам тоже можно видеть отчеты своих групп)
  // Студент - нет доступа к отчетам (обычно это административные документы)

  if (user.role === "STUDENT") {
    throw createError({
      statusCode: 403,
      message: "У вас нет доступа к отчетам группы",
    });
  }

  // Проверяем существование группы
  const group = await getGroupById(groupId);
  if (!group) {
    throw createError({ statusCode: 404, message: "Группа не найдена" });
  }

  // Получаем файлы
  try {
    const files = await executeQuery<any[]>(
      `SELECT 
         id, uuid, filename, size_bytes, extension, uploaded_at_time,
         uploaded_by_user
       FROM files 
       WHERE group_id = ? AND category = 'group_report'
       ORDER BY uploaded_at_time DESC`,
      [groupId]
    );

    console.log(
      `[GET /api/groups/${groupId}/reports] Найдено файлов:`,
      files.length
    );

    return {
      success: true,
      files: files.map((f) => ({
        id: f.id, // ID в БД
        uuid: f.uuid, // Публичный UUID
        name: f.filename,
        size: f.size_bytes,
        extension: f.extension,
        uploadedAt: f.uploaded_at_time,
        uploadedBy: f.uploaded_by_user,
        url: `/api/groups/${groupId}/reports/${f.uuid}`, // Ссылка на скачивание (используем uuid)
      })),
    };
  } catch (error) {
    console.error("Ошибка получения списка отчетов:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении списка отчетов",
    });
  }
});
