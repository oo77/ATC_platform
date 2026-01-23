/**
 * API: Массовое перемещение занятий на выбранную дату
 * POST /api/schedule/bulk-move
 */

import { executeQuery, executeTransaction } from "../../utils/db";
import { isoToMySqlDatetime } from "../../utils/timeUtils";
import { logActivity } from "../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";

interface ScheduleEventRow extends RowDataPacket {
  id: string;
  title: string;
  start_time: Date;
  end_time: Date;
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
      statusMessage: "Недостаточно прав для перемещения занятий",
    });
  }

  const body = await readBody(event);
  const { eventIds, targetDate, preserveSequence = true } = body;

  // Валидация
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Необходимо выбрать хотя бы одно занятие",
    });
  }

  if (!targetDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "Необходимо указать целевую дату",
    });
  }

  // Парсим целевую дату
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный формат даты",
    });
  }

  console.log(
    `[bulk-move] User ${user.id} moving ${eventIds.length} events to ${targetDate}`,
  );

  try {
    // Получаем исходные занятия
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT id, title, start_time, end_time
      FROM schedule_events
      WHERE id IN (${placeholders})
      ORDER BY start_time ASC
    `;

    const sourceEvents = await executeQuery<ScheduleEventRow[]>(
      eventsQuery,
      eventIds,
    );

    if (sourceEvents.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Занятия не найдены",
      });
    }

    const movedEventIds: string[] = [];
    const errors: string[] = [];

    await executeTransaction(async (connection: PoolConnection) => {
      // Определяем базовое время первого занятия
      const firstEvent = sourceEvents[0];
      const firstEventStart = new Date(firstEvent.start_time);

      // Используем то же самое время первого занятия для новой даты
      // (смещение от начала дня сохраняется)

      for (let i = 0; i < sourceEvents.length; i++) {
        const sourceEvent = sourceEvents[i];

        try {
          // Вычисляем новое время
          let newStartTime: Date;
          let newEndTime: Date;

          if (preserveSequence && i > 0) {
            // Сохраняем последовательность
            const eventStart = new Date(sourceEvent.start_time);
            const eventEnd = new Date(sourceEvent.end_time);

            // Смещение от первого занятия
            const offsetFromFirst =
              eventStart.getTime() - firstEventStart.getTime();

            // Создаем новую дату начала на основе целевой даты и времени первого занятия
            newStartTime = new Date(target);
            newStartTime.setHours(
              firstEventStart.getHours(),
              firstEventStart.getMinutes(),
              0,
              0,
            );
            newStartTime = new Date(newStartTime.getTime() + offsetFromFirst);

            // Длительность занятия
            const duration = eventEnd.getTime() - eventStart.getTime();
            newEndTime = new Date(newStartTime.getTime() + duration);
          } else {
            // Просто переносим на новую дату, сохраняя время
            const eventStart = new Date(sourceEvent.start_time);
            const eventEnd = new Date(sourceEvent.end_time);

            newStartTime = new Date(target);
            newStartTime.setHours(
              eventStart.getHours(),
              eventStart.getMinutes(),
              eventStart.getSeconds(),
              0,
            );

            const duration = eventEnd.getTime() - eventStart.getTime();
            newEndTime = new Date(newStartTime.getTime() + duration);
          }

          // Обновляем занятие
          await connection.query(
            `UPDATE schedule_events 
             SET start_time = ?, end_time = ?
             WHERE id = ?`,
            [
              isoToMySqlDatetime(newStartTime.toISOString()),
              isoToMySqlDatetime(newEndTime.toISOString()),
              sourceEvent.id,
            ],
          );

          movedEventIds.push(sourceEvent.id);
        } catch (err: any) {
          console.error(
            `[bulk-move] Error moving event ${sourceEvent.id}:`,
            err,
          );
          errors.push(
            `Ошибка перемещения "${sourceEvent.title}": ${err.message}`,
          );
        }
      }
    });

    // Логирование действия
    await logActivity(
      event,
      "UPDATE",
      "SCHEDULE",
      movedEventIds[0] || undefined,
      `Массовое перемещение ${movedEventIds.length} занятий`,
      {
        movedEventIds,
        targetDate,
        preserveSequence,
      },
    );

    console.log(
      `[bulk-move] Successfully moved ${movedEventIds.length} events`,
    );

    return {
      success: true,
      movedCount: movedEventIds.length,
      movedEventIds,
      errors,
    };
  } catch (error: any) {
    console.error("[bulk-move] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Ошибка массового перемещения",
    });
  }
});
