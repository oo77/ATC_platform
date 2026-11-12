/**
 * API: Массовое копирование занятий на выбранную дату
 * POST /api/schedule/bulk-copy
 */

import { executeQuery, executeTransaction } from "../../utils/db";
import { v4 as uuidv4 } from "uuid";
import { isoToMySqlDatetime } from "../../utils/timeUtils";
import { logActivity } from "../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";
import { Permission, roleHasPermission } from "../../utils/permissions";
import {
  findBatchConflicts,
  throwScheduleConflict,
} from "../../repositories/scheduleRepository";
import { withScheduleWriteLock } from "../../utils/scheduleLock";

interface ScheduleEventRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  group_id: string | null;
  discipline_id: string | null;
  instructor_id: string | null;
  classroom_id: string | null;
  start_time: Date;
  end_time: Date;
  is_all_day: boolean;
  color: string;
  event_type: string;
  duration_minutes: number | null;
  academic_hours: number | null;
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
  if (!roleHasPermission(user, Permission.SCHEDULE_CREATE)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Недостаточно прав для массового копирования",
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
    `[bulk-copy] User ${user.id} copying ${eventIds.length} events to ${targetDate}`,
  );

  try {
    // Получаем исходные занятия
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT 
        id, title, description, group_id, discipline_id, instructor_id, 
        classroom_id, start_time, end_time, is_all_day, color, event_type,
        duration_minutes, academic_hours
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

    const createdEventIds: string[] = [];
    const errors: string[] = [];

    // Новое время всех копий считаем заранее, до любой записи в БД
    const firstEvent = sourceEvents[0];
    const firstEventStart = new Date(firstEvent.start_time);

    const planned = sourceEvents.map((sourceEvent, i) => {
      // Вычисляем новое время
      let newStartTime: Date;
      let newEndTime: Date;

      if (preserveSequence && i > 0) {
        // Сохраняем последовательность: вычисляем смещение от первого занятия
        const eventStart = new Date(sourceEvent.start_time);
        const eventEnd = new Date(sourceEvent.end_time);

        // Смещение от первого занятия (в миллисекундах)
        const offsetFromFirst =
          eventStart.getTime() - firstEventStart.getTime();

        // Создаем новую дату начала
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

    // Проверка и запись — под общей блокировкой. Копии создаются целиком
    // или не создаются вовсе. Копия — обычное занятие (без списка студентов
    // пересдачи), поэтому проверяется как любое другое.
    await withScheduleWriteLock(async () => {
      const conflictMessages = await findBatchConflicts(
        planned.map(({ sourceEvent, newStart, newEnd }) => ({
          label: sourceEvent.title,
          classroomId: sourceEvent.classroom_id,
          instructorId: sourceEvent.instructor_id,
          groupId: sourceEvent.group_id,
          start: newStart,
          end: newEnd,
        })),
      );
      if (conflictMessages.length > 0) {
        throwScheduleConflict(conflictMessages);
      }

      await executeTransaction(async (connection: PoolConnection) => {
        for (const { sourceEvent, newStart, newEnd } of planned) {
          const newId = uuidv4();
          await connection.query(
            `INSERT INTO schedule_events (
              id, title, description, group_id, discipline_id, instructor_id,
              classroom_id, start_time, end_time, is_all_day, color, event_type,
              duration_minutes, academic_hours, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              sourceEvent.title,
              sourceEvent.description,
              sourceEvent.group_id,
              sourceEvent.discipline_id,
              sourceEvent.instructor_id,
              sourceEvent.classroom_id,
              newStart,
              newEnd,
              sourceEvent.is_all_day,
              sourceEvent.color,
              sourceEvent.event_type,
              sourceEvent.duration_minutes,
              sourceEvent.academic_hours,
              user.id,
            ],
          );
          createdEventIds.push(newId);
        }
      });
    });

    // Логирование действия
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      createdEventIds[0] || undefined,
      `Массовое копирование ${createdEventIds.length} занятий`,
      {
        sourceEventIds: eventIds,
        targetDate,
        createdEventIds,
        preserveSequence,
      },
    );

    console.log(
      `[bulk-copy] Successfully copied ${createdEventIds.length} events`,
    );

    return {
      success: true,
      copiedCount: createdEventIds.length,
      createdEventIds,
      errors,
    };
  } catch (error: any) {
    console.error("[bulk-copy] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Ошибка массового копирования",
    });
  }
});
