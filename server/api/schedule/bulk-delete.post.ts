/**
 * API: Массовое удаление занятий
 * POST /api/schedule/bulk-delete
 */

import { executeQuery, executeTransaction } from "../../utils/db";
import { logActivity } from "../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";

interface ScheduleEventRow extends RowDataPacket {
  id: string;
  title: string;
  group_id: string | null;
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Требуется авторизация",
    });
  }

  // Проверка прав (только ADMIN и MANAGER)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Недостаточно прав для массового удаления",
    });
  }

  const body = await readBody(event);
  const { eventIds } = body;

  // Валидация
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Необходимо выбрать хотя бы одно занятие",
    });
  }

  console.log(
    `[bulk-delete] User ${user.id} deleting ${eventIds.length} events`,
  );

  try {
    // Получаем информацию о занятиях для логирования
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT id, title, group_id
      FROM schedule_events
      WHERE id IN (${placeholders})
    `;

    const eventsToDelete = await executeQuery<ScheduleEventRow[]>(
      eventsQuery,
      eventIds,
    );

    if (eventsToDelete.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Занятия не найдены",
      });
    }

    const deletedIds: string[] = [];
    const errors: string[] = [];

    await executeTransaction(async (connection: PoolConnection) => {
      // Удаляем занятия
      const deleteQuery = `DELETE FROM schedule_events WHERE id IN (${placeholders})`;
      const [result] = await connection.query(deleteQuery, eventIds);

      // Получаем количество удаленных записей
      const affectedRows = (result as any).affectedRows || 0;

      // Добавляем все ID как удаленные (если они были в запросе)
      for (const evt of eventsToDelete) {
        deletedIds.push(evt.id);
      }
    });

    // Логирование действия
    await logActivity(
      event,
      "DELETE",
      "SCHEDULE",
      deletedIds[0] || undefined,
      `Массовое удаление ${deletedIds.length} занятий`,
      {
        deletedEventIds: deletedIds,
        deletedEventTitles: eventsToDelete.map((e) => e.title),
      },
    );

    console.log(
      `[bulk-delete] Successfully deleted ${deletedIds.length} events`,
    );

    return {
      success: true,
      deletedCount: deletedIds.length,
      errors,
    };
  } catch (error: any) {
    console.error("[bulk-delete] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Ошибка массового удаления",
    });
  }
});
