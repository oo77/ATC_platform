/**
 * API: Массовое перемещение занятий на выбранную дату
 * POST /api/schedule/bulk-move
 */

import { executeQuery, executeTransaction } from "../../utils/db";
import { isoToMySqlDatetime } from "../../utils/timeUtils";
import { logActivity } from "../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";
import { Permission, roleHasPermission } from "../../utils/permissions";
import {
  findBatchConflicts,
  isRetakeRow,
  throwScheduleConflict,
} from "../../repositories/scheduleRepository";
import { withScheduleWriteLock } from "../../utils/scheduleLock";

interface ScheduleEventRow extends RowDataPacket {
  id: string;
  title: string;
  start_time: Date;
  end_time: Date;
  group_id: string | null;
  instructor_id: string | null;
  classroom_id: string | null;
  original_event_id: string | null;
  allowed_student_ids: unknown;
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

  // Проверка по праву, а не по названию роли
  if (!roleHasPermission(user, Permission.SCHEDULE_UPDATE)) {
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
      SELECT id, title, start_time, end_time, group_id, instructor_id,
             classroom_id, original_event_id, allowed_student_ids
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

    // Новое время всех занятий считаем заранее, до любой записи в БД
    const firstEvent = sourceEvents[0];
    const firstEventStart = new Date(firstEvent.start_time);

    const planned = sourceEvents.map((sourceEvent, i) => {
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

      return {
        sourceEvent,
        newStart: isoToMySqlDatetime(newStartTime.toISOString()),
        newEnd: isoToMySqlDatetime(newEndTime.toISOString()),
      };
    });

    // Проверка и запись — под общей блокировкой. Весь пакет переносится
    // целиком или не переносится вовсе (как и одиночное занятие: 409, БД не тронута).
    await withScheduleWriteLock(async () => {
      const conflictMessages = await findBatchConflicts(
        planned.map(({ sourceEvent, newStart, newEnd }) => ({
          label: sourceEvent.title,
          classroomId: sourceEvent.classroom_id,
          instructorId: sourceEvent.instructor_id,
          groupId: sourceEvent.group_id,
          start: newStart,
          end: newEnd,
          skip: isRetakeRow(sourceEvent),
        })),
        // переносимые занятия освобождают свои старые слоты
        { excludeEventIds: sourceEvents.map((e) => e.id) },
      );
      if (conflictMessages.length > 0) {
        throwScheduleConflict(conflictMessages);
      }

      await executeTransaction(async (connection: PoolConnection) => {
        for (const { sourceEvent, newStart, newEnd } of planned) {
          await connection.query(
            `UPDATE schedule_events
             SET start_time = ?, end_time = ?
             WHERE id = ?`,
            [newStart, newEnd, sourceEvent.id],
          );
          movedEventIds.push(sourceEvent.id);
        }
      });
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
